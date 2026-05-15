import * as vscode from "vscode"
import { ExtensionRegistryInfo } from "@/registry"
import { OpenNodusSidebarPanelRequest, OpenNodusSidebarPanelResponse } from "@/shared/proto/index.host"

export async function openNodusSidebarPanel(_: OpenNodusSidebarPanelRequest): Promise<OpenNodusSidebarPanelResponse> {
	await vscode.commands.executeCommand(`${ExtensionRegistryInfo.views.Sidebar}.focus`)
	return {}
}
