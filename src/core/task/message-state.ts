import CheckpointTracker from "@integrations/checkpoints/CheckpointTracker"
import { EventEmitter } from "events"
import getFolderSize from "get-folder-size"
import Mutex from "p-mutex"
import { findLastIndex } from "@/shared/array"
import { combineApiRequests } from "@/shared/combineApiRequests"
import { combineCommandSequences } from "@/shared/combineCommandSequences"
import { NodusMessage } from "@/shared/ExtensionMessage"
import { getApiMetrics } from "@/shared/getApiMetrics"
import { HistoryItem } from "@/shared/HistoryItem"
import { NodusStorageMessage } from "@/shared/messages/content"
import { Logger } from "@/shared/services/Logger"
import { getCwd, getDesktopDir } from "@/utils/path"
import { ensureTaskDirectoryExists, saveApiConversationHistory, savenodusMessages } from "../storage/disk"
import { TaskState } from "./TaskState"

// Event types for nodusMessages changes
export type NodusMessageChangeType = "add" | "update" | "delete" | "set"

export interface NodusMessageChange {
	type: NodusMessageChangeType
	/** The full array after the change */
	messages: NodusMessage[]
	/** The affected index (for add/update/delete) */
	index?: number
	/** The new/updated message (for add/update) */
	message?: NodusMessage
	/** The old message before change (for update/delete) */
	previousMessage?: NodusMessage
	/** The entire previous array (for set) */
	previousMessages?: NodusMessage[]
}

// Strongly-typed event emitter interface
export interface MessageStateHandlerEvents {
	nodusMessagesChanged: [change: NodusMessageChange]
}

interface MessageStateHandlerParams {
	taskId: string
	ulid: string
	taskIsFavorited?: boolean
	updateTaskHistory: (historyItem: HistoryItem) => Promise<HistoryItem[]>
	taskState: TaskState
	checkpointManagerErrorMessage?: string
}

export class MessageStateHandler extends EventEmitter<MessageStateHandlerEvents> {
	private apiConversationHistory: NodusStorageMessage[] = []
	private nodusMessages: NodusMessage[] = []
	private taskIsFavorited: boolean
	private checkpointTracker: CheckpointTracker | undefined
	private updateTaskHistory: (historyItem: HistoryItem) => Promise<HistoryItem[]>
	private taskId: string
	private ulid: string
	private taskState: TaskState

	// Mutex to prevent concurrent state modifications (RC-4)
	// Protects against data loss from race conditions when multiple
	// operations try to modify message state simultaneously
	// This follows the same pattern as Task.stateMutex for consistency
	private stateMutex = new Mutex()

	constructor(params: MessageStateHandlerParams) {
		super()
		this.taskId = params.taskId
		this.ulid = params.ulid
		this.taskState = params.taskState
		this.taskIsFavorited = params.taskIsFavorited ?? false
		this.updateTaskHistory = params.updateTaskHistory
	}

	/**
	 * Emit a nodusMessagesChanged event with the change details
	 */
	private emitnodusMessagesChanged(change: NodusMessageChange): void {
		this.emit("nodusMessagesChanged", change)
	}

	setCheckpointTracker(tracker: CheckpointTracker | undefined) {
		this.checkpointTracker = tracker
	}

	/**
	 * Execute function with exclusive lock on message state
	 * Use this for ANY state modification to prevent race conditions
	 * This follows the same pattern as Task.withStateLock for consistency
	 */
	private async withStateLock<T>(fn: () => T | Promise<T>): Promise<T> {
		return await this.stateMutex.withLock(fn)
	}

	getApiConversationHistory(): NodusStorageMessage[] {
		return this.apiConversationHistory
	}

	setApiConversationHistory(newHistory: NodusStorageMessage[]): void {
		this.apiConversationHistory = newHistory
	}

	getnodusMessages(): NodusMessage[] {
		return this.nodusMessages
	}

	setnodusMessages(newMessages: NodusMessage[]) {
		const previousMessages = this.nodusMessages
		this.nodusMessages = newMessages
		this.emitnodusMessagesChanged({
			type: "set",
			messages: this.nodusMessages,
			previousMessages,
		})
	}

	/**
	 * Internal method to save messages and update history (without mutex protection)
	 * This is used by methods that already hold the stateMutex lock
	 * Should NOT be called directly - use savenodusMessagesAndUpdateHistory() instead
	 */
	private async savenodusMessagesAndUpdateHistoryInternal(): Promise<void> {
		try {
			await savenodusMessages(this.taskId, this.nodusMessages)

			// combined as they are in ChatView
			const apiMetrics = getApiMetrics(combineApiRequests(combineCommandSequences(this.nodusMessages.slice(1))))
			const taskMessage = this.nodusMessages[0] // first message is always the task say
			const lastRelevantMessage =
				this.nodusMessages[
					findLastIndex(
						this.nodusMessages,
						(message) => !(message.ask === "resume_task" || message.ask === "resume_completed_task"),
					)
				]
			const lastModelInfo = [...this.apiConversationHistory].reverse().find((msg) => msg.modelInfo !== undefined)
			const taskDir = await ensureTaskDirectoryExists(this.taskId)
			let taskDirSize = 0
			try {
				// getFolderSize.loose silently ignores errors
				// returns # of bytes, size/1000/1000 = MB
				taskDirSize = await getFolderSize.loose(taskDir)
			} catch (error) {
				Logger.error("Failed to get task directory size:", taskDir, error)
			}
			const cwd = await getCwd(getDesktopDir())
			await this.updateTaskHistory({
				id: this.taskId,
				ulid: this.ulid,
				ts: lastRelevantMessage.ts,
				task: taskMessage.text ?? "",
				tokensIn: apiMetrics.totalTokensIn,
				tokensOut: apiMetrics.totalTokensOut,
				cacheWrites: apiMetrics.totalCacheWrites,
				cacheReads: apiMetrics.totalCacheReads,
				totalCost: apiMetrics.totalCost,
				size: taskDirSize,
				shadowGitConfigWorkTree: await this.checkpointTracker?.getShadowGitConfigWorkTree(),
				cwdOnTaskInitialization: cwd,
				conversationHistoryDeletedRange: this.taskState.conversationHistoryDeletedRange,
				isFavorited: this.taskIsFavorited,
				checkpointManagerErrorMessage: this.taskState.checkpointManagerErrorMessage,
				modelId: lastModelInfo?.modelInfo?.modelId,
			})
		} catch (error) {
			Logger.error("Failed to save Nodus messages:", error)
		}
	}

	/**
	 * Save Nodus messages and update task history (public API with mutex protection)
	 * This is the main entry point for saving message state from external callers
	 */
	async savenodusMessagesAndUpdateHistory(): Promise<void> {
		return await this.withStateLock(async () => {
			await this.savenodusMessagesAndUpdateHistoryInternal()
		})
	}

	async addToApiConversationHistory(message: NodusStorageMessage) {
		// Protect with mutex to prevent concurrent modifications from corrupting data (RC-4)
		return await this.withStateLock(async () => {
			this.apiConversationHistory.push(message)
			await saveApiConversationHistory(this.taskId, this.apiConversationHistory)
		})
	}

	async overwriteApiConversationHistory(newHistory: NodusStorageMessage[]): Promise<void> {
		// Protect with mutex to prevent concurrent modifications from corrupting data (RC-4)
		return await this.withStateLock(async () => {
			this.apiConversationHistory = newHistory
			await saveApiConversationHistory(this.taskId, this.apiConversationHistory)
		})
	}

	/**
	 * Add a new message to nodusMessages array with proper index tracking
	 * CRITICAL: This entire operation must be atomic to prevent race conditions (RC-4)
	 * The conversationHistoryIndex must be set correctly based on the current state,
	 * and the message must be added and saved without any interleaving operations
	 */
	async addTonodusMessages(message: NodusMessage) {
		return await this.withStateLock(async () => {
			// these values allow us to reconstruct the conversation history at the time this Nodus message was created
			// it's important that apiConversationHistory is initialized before we add Nodus messages
			message.conversationHistoryIndex = this.apiConversationHistory.length - 1 // NOTE: this is the index of the last added message which is the user message, and once the nodusMessages have been presented we update the apiconversationhistory with the completed assistant message. This means when resetting to a message, we need to +1 this index to get the correct assistant message that this tool use corresponds to
			message.conversationHistoryDeletedRange = this.taskState.conversationHistoryDeletedRange
			const index = this.nodusMessages.length
			this.nodusMessages.push(message)
			this.emitnodusMessagesChanged({
				type: "add",
				messages: this.nodusMessages,
				index,
				message,
			})
			await this.savenodusMessagesAndUpdateHistoryInternal()
		})
	}

	/**
	 * Replace the entire nodusMessages array with new messages
	 * Protected by mutex to prevent concurrent modifications (RC-4)
	 */
	async overwritenodusMessages(newMessages: NodusMessage[]) {
		return await this.withStateLock(async () => {
			const previousMessages = this.nodusMessages
			this.nodusMessages = newMessages
			this.emitnodusMessagesChanged({
				type: "set",
				messages: this.nodusMessages,
				previousMessages,
			})
			await this.savenodusMessagesAndUpdateHistoryInternal()
		})
	}

	/**
	 * Update a specific message in the nodusMessages array
	 * The entire operation (validate, update, save) is atomic to prevent races (RC-4)
	 */
	async updateNodusMessage(index: number, updates: Partial<NodusMessage>): Promise<void> {
		return await this.withStateLock(async () => {
			if (index < 0 || index >= this.nodusMessages.length) {
				throw new Error(`Invalid message index: ${index}`)
			}

			// Capture previous state before mutation
			const previousMessage = { ...this.nodusMessages[index] }

			// Apply updates to the message
			Object.assign(this.nodusMessages[index], updates)

			this.emitnodusMessagesChanged({
				type: "update",
				messages: this.nodusMessages,
				index,
				previousMessage,
				message: this.nodusMessages[index],
			})

			// Save changes and update history
			await this.savenodusMessagesAndUpdateHistoryInternal()
		})
	}

	/**
	 * Delete a specific message from the nodusMessages array
	 * The entire operation (validate, delete, save) is atomic to prevent races (RC-4)
	 */
	async deleteNodusMessage(index: number): Promise<void> {
		return await this.withStateLock(async () => {
			if (index < 0 || index >= this.nodusMessages.length) {
				throw new Error(`Invalid message index: ${index}`)
			}

			// Capture the message before deletion
			const previousMessage = this.nodusMessages[index]

			// Remove the message at the specified index
			this.nodusMessages.splice(index, 1)

			this.emitnodusMessagesChanged({
				type: "delete",
				messages: this.nodusMessages,
				index,
				previousMessage,
			})

			// Save changes and update history
			await this.savenodusMessagesAndUpdateHistoryInternal()
		})
	}
}
