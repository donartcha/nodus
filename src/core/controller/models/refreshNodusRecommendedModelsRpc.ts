import { EmptyRequest } from "@shared/proto/nodus/common"
import { NodusRecommendedModel, NodusRecommendedModelsResponse } from "@shared/proto/nodus/models"
import type { Controller } from "../index"
import { refreshNodusRecommendedModels } from "./refreshNodusRecommendedModels"

export async function refreshNodusRecommendedModelsRpc(
	_controller: Controller,
	_request: EmptyRequest,
): Promise<NodusRecommendedModelsResponse> {
	const models = await refreshNodusRecommendedModels()
	return NodusRecommendedModelsResponse.create({
		recommended: models.recommended.map((model) =>
			NodusRecommendedModel.create({
				id: model.id,
				name: model.name,
				description: model.description,
				tags: model.tags,
			}),
		),
		free: models.free.map((model) =>
			NodusRecommendedModel.create({
				id: model.id,
				name: model.name,
				description: model.description,
				tags: model.tags,
			}),
		),
	})
}
