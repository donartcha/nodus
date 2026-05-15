import { isMultiRootWorkspace } from "@/core/workspace/utils/workspace-detection"
import { HostProvider } from "@/hosts/host-provider"
import { ExtensionRegistryInfo } from "@/registry"
import { EmptyRequest } from "@/shared/proto/Nodus/common"
import { Logger } from "@/shared/services/Logger"

// Canonical header names for extra client/host context
export const NodusHeaders = {
	PLATFORM: "X-PLATFORM",
	PLATFORM_VERSION: "X-PLATFORM-VERSION",
	CLIENT_VERSION: "X-CLIENT-VERSION",
	CLIENT_TYPE: "X-CLIENT-TYPE",
	CORE_VERSION: "X-CORE-VERSION",
	IS_MULTIROOT: "X-IS-MULTIROOT",
} as const
export type NodusHeaderName = (typeof NodusHeaders)[keyof typeof NodusHeaders]

export function buildExternalBasicHeaders(): Record<string, string> {
	return {
		"User-Agent": `Nodus/${ExtensionRegistryInfo.version}`,
	}
}

export async function buildBasicNodusHeaders(): Promise<Record<string, string>> {
	const headers: Record<string, string> = buildExternalBasicHeaders()
	try {
		const host = await HostProvider.env.getHostVersion(EmptyRequest.create({}))
		headers[NodusHeaders.PLATFORM] = host.platform || "unknown"
		headers[NodusHeaders.PLATFORM_VERSION] = host.version || "unknown"
		headers[NodusHeaders.CLIENT_TYPE] = host.NodusType || "unknown"
		headers[NodusHeaders.CLIENT_VERSION] = host.NodusVersion || "unknown"
	} catch (error) {
		Logger.log("Failed to get IDE/platform info via HostBridge EnvService.getHostVersion", error)
		headers[NodusHeaders.PLATFORM] = "unknown"
		headers[NodusHeaders.PLATFORM_VERSION] = "unknown"
		headers[NodusHeaders.CLIENT_TYPE] = "unknown"
		headers[NodusHeaders.CLIENT_VERSION] = "unknown"
	}
	headers[NodusHeaders.CORE_VERSION] = ExtensionRegistryInfo.version

	return headers
}

export async function buildNodusExtraHeaders(): Promise<Record<string, string>> {
	const headers = await buildBasicNodusHeaders()

	try {
		const isMultiRoot = await isMultiRootWorkspace()
		headers[NodusHeaders.IS_MULTIROOT] = isMultiRoot ? "true" : "false"
	} catch (error) {
		Logger.log("Failed to detect multi-root workspace", error)
		headers[NodusHeaders.IS_MULTIROOT] = "false"
	}

	return headers
}
