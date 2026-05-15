import { strict as assert } from "node:assert"
import type { ToolUse } from "@core/assistant-message"
import { registerPartialMessageCallback } from "@core/controller/ui/subscribeToPartialMessage"
import { Task } from "@core/task"
import type { NodusMessage } from "@shared/ExtensionMessage"
import { NodusDefaultTool } from "@shared/tools"
import { describe, it } from "mocha"

describe("Task.processNativeToolCalls", () => {
	it("finalizes a partial text row before handing off to native tool calls", async () => {
		const nodusMessages: NodusMessage[] = [
			{
				ts: 1,
				type: "say",
				say: "text",
				text: "partial text before tool handoff",
				partial: true,
			},
		]

		let saveCalls = 0
		const emittedPartialMessages: Array<{ partial: boolean; text: string }> = []
		const unsubscribe = registerPartialMessageCallback((message) => {
			emittedPartialMessages.push({
				partial: message.partial,
				text: message.text,
			})
		})

		const toolBlocks: ToolUse[] = [
			{
				type: "tool_use",
				name: NodusDefaultTool.ASK,
				params: {
					question: "Need clarification",
				},
				partial: true,
				isNativeToolCall: true,
				call_id: "call-1",
			},
		]

		const fakeTask = {
			messageStateHandler: {
				getnodusMessages: () => nodusMessages,
				savenodusMessagesAndUpdateHistory: async () => {
					saveCalls += 1
				},
			},
			taskState: {
				assistantMessageContent: [],
				currentStreamingContentIndex: 0,
				userMessageContentReady: true,
			},
		}

		try {
			await (
				Task.prototype as unknown as { processNativeToolCalls: (text: string, blocks: ToolUse[]) => Promise<void> }
			).processNativeToolCalls.call(fakeTask, "visible streamed text", toolBlocks)

			assert.equal(nodusMessages[0].text, "visible streamed text")
			assert.equal(nodusMessages[0].partial, false)
			assert.equal(saveCalls, 1)
			assert.deepEqual(emittedPartialMessages, [{ partial: false, text: "visible streamed text" }])

			assert.deepEqual(fakeTask.taskState.assistantMessageContent, [
				{ type: "text", content: "visible streamed text", partial: false },
				...toolBlocks,
			])
			assert.equal(fakeTask.taskState.currentStreamingContentIndex, 1)
			assert.equal(fakeTask.taskState.userMessageContentReady, false)
		} finally {
			unsubscribe()
		}
	})
})
