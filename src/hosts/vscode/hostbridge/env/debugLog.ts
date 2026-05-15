import { Empty, StringRequest } from "@shared/proto/nodus/common"
import * as vscode from "vscode"

const NODUS_OUTPUT_CHANNEL = vscode.window.createOutputChannel("Nodus")

// Appends a log message to all Nodus output channels.
export async function debugLog(request: StringRequest): Promise<Empty> {
	NODUS_OUTPUT_CHANNEL.appendLine(request.value)
	return Empty.create({})
}

// Register the Nodus output channel within the VSCode extension context.
export function registerNodusOutputChannel(context: vscode.ExtensionContext): vscode.OutputChannel {
	context.subscriptions.push(NODUS_OUTPUT_CHANNEL)
	return NODUS_OUTPUT_CHANNEL
}
