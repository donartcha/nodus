import { EmptyRequest } from "@shared/proto/nodus/common"
import { OpenRouterCompatibleModelInfo } from "@shared/proto/nodus/models"
import { toProtobufModels } from "../../../shared/proto-conversions/models/typeConversion"
import type { Controller } from "../index"
import { refreshnodusModels } from "./refreshnodusModels"

/**
 * Refreshes Nodus models and returns protobuf types for gRPC
 * @param controller The controller instance
 * @param request Empty request (unused but required for gRPC signature)
 * @returns OpenRouterCompatibleModelInfo with protobuf types (reusing the same proto type)
 */
export async function refreshnodusModelsRpc(
	controller: Controller,
	_request: EmptyRequest,
): Promise<OpenRouterCompatibleModelInfo> {
	const models = await refreshnodusModels(controller)
	return OpenRouterCompatibleModelInfo.create({
		models: toProtobufModels(models),
	})
}
