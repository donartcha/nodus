import { NodusAsk as AppNodusAsk, NodusMessage as AppNodusMessage, NodusSay as AppNodusSay } from "@shared/ExtensionMessage"
import { NodusAsk, NodusMessageType, NodusSay, NodusMessage as ProtoNodusMessage } from "@shared/proto/nodus/ui"

// Helper function to convert NodusAsk string to enum
function convertNodusAskToProtoEnum(ask: AppNodusAsk | undefined): NodusAsk | undefined {
	if (!ask) {
		return undefined
	}

	const mapping: Record<AppNodusAsk, NodusAsk> = {
		followup: NodusAsk.FOLLOWUP,
		plan_mode_respond: NodusAsk.PLAN_MODE_RESPOND,
		act_mode_respond: NodusAsk.ACT_MODE_RESPOND,
		command: NodusAsk.COMMAND,
		command_output: NodusAsk.COMMAND_OUTPUT,
		completion_result: NodusAsk.COMPLETION_RESULT,
		tool: NodusAsk.TOOL,
		api_req_failed: NodusAsk.API_REQ_FAILED,
		resume_task: NodusAsk.RESUME_TASK,
		resume_completed_task: NodusAsk.RESUME_COMPLETED_TASK,
		mistake_limit_reached: NodusAsk.MISTAKE_LIMIT_REACHED,
		browser_action_launch: NodusAsk.BROWSER_ACTION_LAUNCH,
		use_mcp_server: NodusAsk.USE_MCP_SERVER,
		new_task: NodusAsk.NEW_TASK,
		condense: NodusAsk.CONDENSE,
		summarize_task: NodusAsk.SUMMARIZE_TASK,
		report_bug: NodusAsk.REPORT_BUG,
		use_subagents: NodusAsk.USE_SUBAGENTS,
	}

	const result = mapping[ask]
	if (result === undefined) {
	}
	return result
}

// Helper function to convert NodusAsk enum to string
function convertProtoEnumToNodusAsk(ask: NodusAsk): AppNodusAsk | undefined {
	if (ask === NodusAsk.UNRECOGNIZED) {
		return undefined
	}

	const mapping: Record<Exclude<NodusAsk, NodusAsk.UNRECOGNIZED>, AppNodusAsk> = {
		[NodusAsk.FOLLOWUP]: "followup",
		[NodusAsk.PLAN_MODE_RESPOND]: "plan_mode_respond",
		[NodusAsk.ACT_MODE_RESPOND]: "act_mode_respond",
		[NodusAsk.COMMAND]: "command",
		[NodusAsk.COMMAND_OUTPUT]: "command_output",
		[NodusAsk.COMPLETION_RESULT]: "completion_result",
		[NodusAsk.TOOL]: "tool",
		[NodusAsk.API_REQ_FAILED]: "api_req_failed",
		[NodusAsk.RESUME_TASK]: "resume_task",
		[NodusAsk.RESUME_COMPLETED_TASK]: "resume_completed_task",
		[NodusAsk.MISTAKE_LIMIT_REACHED]: "mistake_limit_reached",
		[NodusAsk.BROWSER_ACTION_LAUNCH]: "browser_action_launch",
		[NodusAsk.USE_MCP_SERVER]: "use_mcp_server",
		[NodusAsk.NEW_TASK]: "new_task",
		[NodusAsk.CONDENSE]: "condense",
		[NodusAsk.SUMMARIZE_TASK]: "summarize_task",
		[NodusAsk.REPORT_BUG]: "report_bug",
		[NodusAsk.USE_SUBAGENTS]: "use_subagents",
	}

	return mapping[ask]
}

// Helper function to convert NodusSay string to enum
function convertNodusSayToProtoEnum(say: AppNodusSay | undefined): NodusSay | undefined {
	if (!say) {
		return undefined
	}

	const mapping: Record<AppNodusSay, NodusSay> = {
		task: NodusSay.TASK,
		error: NodusSay.ERROR,
		api_req_started: NodusSay.API_REQ_STARTED,
		api_req_finished: NodusSay.API_REQ_FINISHED,
		text: NodusSay.TEXT,
		reasoning: NodusSay.REASONING,
		completion_result: NodusSay.COMPLETION_RESULT_SAY,
		user_feedback: NodusSay.USER_FEEDBACK,
		user_feedback_diff: NodusSay.USER_FEEDBACK_DIFF,
		api_req_retried: NodusSay.API_REQ_RETRIED,
		command: NodusSay.COMMAND_SAY,
		command_output: NodusSay.COMMAND_OUTPUT_SAY,
		tool: NodusSay.TOOL_SAY,
		shell_integration_warning: NodusSay.SHELL_INTEGRATION_WARNING,
		shell_integration_warning_with_suggestion: NodusSay.SHELL_INTEGRATION_WARNING,
		browser_action_launch: NodusSay.BROWSER_ACTION_LAUNCH_SAY,
		browser_action: NodusSay.BROWSER_ACTION,
		browser_action_result: NodusSay.BROWSER_ACTION_RESULT,
		mcp_server_request_started: NodusSay.MCP_SERVER_REQUEST_STARTED,
		mcp_server_response: NodusSay.MCP_SERVER_RESPONSE,
		mcp_notification: NodusSay.MCP_NOTIFICATION,
		use_mcp_server: NodusSay.USE_MCP_SERVER_SAY,
		diff_error: NodusSay.DIFF_ERROR,
		deleted_api_reqs: NodusSay.DELETED_API_REQS,
		NodusIGNORE_ERROR: NodusSay.NodusIGNORE_ERROR,
		command_permission_denied: NodusSay.COMMAND_PERMISSION_DENIED,
		checkpoint_created: NodusSay.CHECKPOINT_CREATED,
		load_mcp_documentation: NodusSay.LOAD_MCP_DOCUMENTATION,
		info: NodusSay.INFO,
		task_progress: NodusSay.TASK_PROGRESS,
		error_retry: NodusSay.ERROR_RETRY,
		hook_status: NodusSay.HOOK_STATUS,
		hook_output_stream: NodusSay.HOOK_OUTPUT_STREAM,
		conditional_rules_applied: NodusSay.CONDITIONAL_RULES_APPLIED,
		subagent: NodusSay.SUBAGENT_STATUS,
		use_subagents: NodusSay.USE_SUBAGENTS_SAY,
		subagent_usage: NodusSay.SUBAGENT_USAGE,
		generate_explanation: NodusSay.GENERATE_EXPLANATION,
	}

	const result = mapping[say]

	return result
}

// Helper function to convert NodusSay enum to string
function convertProtoEnumToNodusSay(say: NodusSay): AppNodusSay | undefined {
	if (say === NodusSay.UNRECOGNIZED) {
		return undefined
	}

	const mapping: Record<Exclude<NodusSay, NodusSay.UNRECOGNIZED>, AppNodusSay> = {
		[NodusSay.TASK]: "task",
		[NodusSay.ERROR]: "error",
		[NodusSay.API_REQ_STARTED]: "api_req_started",
		[NodusSay.API_REQ_FINISHED]: "api_req_finished",
		[NodusSay.TEXT]: "text",
		[NodusSay.REASONING]: "reasoning",
		[NodusSay.COMPLETION_RESULT_SAY]: "completion_result",
		[NodusSay.USER_FEEDBACK]: "user_feedback",
		[NodusSay.USER_FEEDBACK_DIFF]: "user_feedback_diff",
		[NodusSay.API_REQ_RETRIED]: "api_req_retried",
		[NodusSay.COMMAND_SAY]: "command",
		[NodusSay.COMMAND_OUTPUT_SAY]: "command_output",
		[NodusSay.TOOL_SAY]: "tool",
		[NodusSay.SHELL_INTEGRATION_WARNING]: "shell_integration_warning",
		[NodusSay.BROWSER_ACTION_LAUNCH_SAY]: "browser_action_launch",
		[NodusSay.BROWSER_ACTION]: "browser_action",
		[NodusSay.BROWSER_ACTION_RESULT]: "browser_action_result",
		[NodusSay.MCP_SERVER_REQUEST_STARTED]: "mcp_server_request_started",
		[NodusSay.MCP_SERVER_RESPONSE]: "mcp_server_response",
		[NodusSay.MCP_NOTIFICATION]: "mcp_notification",
		[NodusSay.USE_MCP_SERVER_SAY]: "use_mcp_server",
		[NodusSay.DIFF_ERROR]: "diff_error",
		[NodusSay.DELETED_API_REQS]: "deleted_api_reqs",
		[NodusSay.NodusIGNORE_ERROR]: "NodusIGNORE_ERROR",
		[NodusSay.COMMAND_PERMISSION_DENIED]: "command_permission_denied",
		[NodusSay.CHECKPOINT_CREATED]: "checkpoint_created",
		[NodusSay.LOAD_MCP_DOCUMENTATION]: "load_mcp_documentation",
		[NodusSay.INFO]: "info",
		[NodusSay.TASK_PROGRESS]: "task_progress",
		[NodusSay.ERROR_RETRY]: "error_retry",
		[NodusSay.GENERATE_EXPLANATION]: "generate_explanation",
		[NodusSay.HOOK_STATUS]: "hook_status",
		[NodusSay.HOOK_OUTPUT_STREAM]: "hook_output_stream",
		[NodusSay.CONDITIONAL_RULES_APPLIED]: "conditional_rules_applied",
		[NodusSay.SUBAGENT_STATUS]: "subagent",
		[NodusSay.USE_SUBAGENTS_SAY]: "use_subagents",
		[NodusSay.SUBAGENT_USAGE]: "subagent_usage",
	}

	return mapping[say]
}

/**
 * Convert application NodusMessage to proto NodusMessage
 */
export function convertNodusMessageToProto(message: AppNodusMessage): ProtoNodusMessage {
	// For sending messages, we need to provide values for required proto fields
	const askEnum = message.ask ? convertNodusAskToProtoEnum(message.ask) : undefined
	const sayEnum = message.say ? convertNodusSayToProtoEnum(message.say) : undefined

	// Determine appropriate enum values based on message type
	let finalAskEnum: NodusAsk = NodusAsk.FOLLOWUP // Proto default
	let finalSayEnum: NodusSay = NodusSay.TEXT // Proto default

	if (message.type === "ask") {
		finalAskEnum = askEnum ?? NodusAsk.FOLLOWUP // Use FOLLOWUP as default for ask messages
	} else if (message.type === "say") {
		finalSayEnum = sayEnum ?? NodusSay.TEXT // Use TEXT as default for say messages
	}

	const protoMessage: ProtoNodusMessage = {
		ts: message.ts,
		type: message.type === "ask" ? NodusMessageType.ASK : NodusMessageType.SAY,
		ask: finalAskEnum,
		say: finalSayEnum,
		text: message.text ?? "",
		reasoning: message.reasoning ?? "",
		images: message.images ?? [],
		files: message.files ?? [],
		partial: message.partial ?? false,
		lastCheckpointHash: message.lastCheckpointHash ?? "",
		isCheckpointCheckedOut: message.isCheckpointCheckedOut ?? false,
		isOperationOutsideWorkspace: message.isOperationOutsideWorkspace ?? false,
		conversationHistoryIndex: message.conversationHistoryIndex ?? 0,
		conversationHistoryDeletedRange: message.conversationHistoryDeletedRange
			? {
					startIndex: message.conversationHistoryDeletedRange[0],
					endIndex: message.conversationHistoryDeletedRange[1],
				}
			: undefined,
		// Additional optional fields for specific ask/say types
		sayTool: undefined,
		sayBrowserAction: undefined,
		browserActionResult: undefined,
		askUseMcpServer: undefined,
		planModeResponse: undefined,
		askQuestion: undefined,
		askNewTask: undefined,
		apiReqInfo: undefined,
		modelInfo: message.modelInfo ?? undefined,
	}

	return protoMessage
}

/**
 * Convert proto NodusMessage to application NodusMessage
 */
export function convertProtoToNodusMessage(protoMessage: ProtoNodusMessage): AppNodusMessage {
	const message: AppNodusMessage = {
		ts: protoMessage.ts,
		type: protoMessage.type === NodusMessageType.ASK ? "ask" : "say",
	}

	// Convert ask enum to string
	if (protoMessage.type === NodusMessageType.ASK) {
		const ask = convertProtoEnumToNodusAsk(protoMessage.ask)
		if (ask !== undefined) {
			message.ask = ask
		}
	}

	// Convert say enum to string
	if (protoMessage.type === NodusMessageType.SAY) {
		const say = convertProtoEnumToNodusSay(protoMessage.say)
		if (say !== undefined) {
			message.say = say
		}
	}

	// Convert other fields - preserve empty strings as they may be intentional
	if (protoMessage.text !== "") {
		message.text = protoMessage.text
	}
	if (protoMessage.reasoning !== "") {
		message.reasoning = protoMessage.reasoning
	}
	if (protoMessage.images.length > 0) {
		message.images = protoMessage.images
	}
	if (protoMessage.files.length > 0) {
		message.files = protoMessage.files
	}
	if (protoMessage.partial) {
		message.partial = protoMessage.partial
	}
	if (protoMessage.lastCheckpointHash !== "") {
		message.lastCheckpointHash = protoMessage.lastCheckpointHash
	}
	if (protoMessage.isCheckpointCheckedOut) {
		message.isCheckpointCheckedOut = protoMessage.isCheckpointCheckedOut
	}
	if (protoMessage.isOperationOutsideWorkspace) {
		message.isOperationOutsideWorkspace = protoMessage.isOperationOutsideWorkspace
	}
	if (protoMessage.conversationHistoryIndex !== 0) {
		message.conversationHistoryIndex = protoMessage.conversationHistoryIndex
	}

	// Convert conversationHistoryDeletedRange from object to tuple
	if (protoMessage.conversationHistoryDeletedRange) {
		message.conversationHistoryDeletedRange = [
			protoMessage.conversationHistoryDeletedRange.startIndex,
			protoMessage.conversationHistoryDeletedRange.endIndex,
		]
	}

	return message
}
