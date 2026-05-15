import { ensureCacheDirectoryExists, GlobalFileNames } from "@core/storage/disk"
import axios from "axios"
import fs from "fs/promises"
import path from "path"
import { NodusEnv } from "@/config"
import { featureFlagsService } from "@/services/feature-flags"
import { NODUS_RECOMMENDED_MODELS_FALLBACK } from "@/shared/nodus/recommended-models"
import { getAxiosSettings } from "@/shared/net"
import { FeatureFlag } from "@/shared/services/feature-flags/feature-flags"
import { Logger } from "@/shared/services/Logger"

export interface NodusRecommendedModelData {
	id: string
	name: string
	description: string
	tags: string[]
}

export interface NodusRecommendedModelsData {
	recommended: NodusRecommendedModelData[]
	free: NodusRecommendedModelData[]
}

const RECOMMENDED_MODELS_CACHE_TTL_MS = 60 * 60 * 1000

let pendingRefresh: Promise<NodusRecommendedModelsData> | null = null
let inMemoryCache: { data: NodusRecommendedModelsData; timestamp: number } | null = null

function getHardcodedRecommendedModels(): NodusRecommendedModelsData {
	return NODUS_RECOMMENDED_MODELS_FALLBACK
}

function useUpstreamRecommendedModels(): boolean {
	return featureFlagsService.getBooleanFlagEnabled(FeatureFlag.NODUS_RECOMMENDED_MODELS_UPSTREAM)
}

function normalizeRecommendedModel(raw: unknown): NodusRecommendedModelData | null {
	if (!raw || typeof raw !== "object") {
		return null
	}

	const data = raw as Record<string, unknown>
	if (typeof data.id !== "string" || data.id.length === 0) {
		return null
	}

	return {
		id: data.id,
		name: typeof data.name === "string" && data.name.length > 0 ? data.name : data.id,
		description: typeof data.description === "string" ? data.description : "",
		tags: Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === "string") : [],
	}
}

function normalizeRecommendedModelsResponse(raw: unknown): NodusRecommendedModelsData | null {
	if (!raw || typeof raw !== "object") {
		return null
	}

	const data = raw as Record<string, unknown>
	if (
		(data.recommended !== undefined && !Array.isArray(data.recommended)) ||
		(data.free !== undefined && !Array.isArray(data.free))
	) {
		return null
	}

	const recommendedRaw = Array.isArray(data.recommended) ? data.recommended : []
	const freeRaw = Array.isArray(data.free) ? data.free : []

	const recommended = recommendedRaw
		.map((model) => normalizeRecommendedModel(model))
		.filter((model): model is NodusRecommendedModelData => model !== null)

	const free = freeRaw
		.map((model) => normalizeRecommendedModel(model))
		.filter((model): model is NodusRecommendedModelData => model !== null)

	return { recommended, free }
}

export async function refreshNodusRecommendedModels(): Promise<NodusRecommendedModelsData> {
	if (!useUpstreamRecommendedModels()) {
		return getHardcodedRecommendedModels()
	}

	if (inMemoryCache && Date.now() - inMemoryCache.timestamp <= RECOMMENDED_MODELS_CACHE_TTL_MS) {
		return inMemoryCache.data
	}

	if (pendingRefresh) {
		return pendingRefresh
	}

	pendingRefresh = (async () => {
		try {
			return await fetchAndCacheNodusRecommendedModels()
		} finally {
			pendingRefresh = null
		}
	})()

	return pendingRefresh
}

export function resetNodusRecommendedModelsCacheForTests(): void {
	pendingRefresh = null
	inMemoryCache = null
}

async function fetchAndCacheNodusRecommendedModels(): Promise<NodusRecommendedModelsData> {
	const NodusRecommendedModelsFilePath = path.join(await ensureCacheDirectoryExists(), GlobalFileNames.NodusRecommendedModels)
	let result: NodusRecommendedModelsData = { recommended: [], free: [] }

	try {
		const apiBaseUrl = NodusEnv.config().apiBaseUrl
		const response = await axios.get(`${apiBaseUrl}/api/v1/ai/Nodus/recommended-models`, getAxiosSettings())
		const normalized = normalizeRecommendedModelsResponse(response.data)
		if (!normalized) {
			throw new Error("Invalid response data when fetching Nodus recommended models")
		}

		result = normalized
		await fs.writeFile(NodusRecommendedModelsFilePath, JSON.stringify(result))
		Logger.log("Nodus recommended models fetched and saved")
	} catch (error) {
		Logger.error("Error fetching Nodus recommended models:", error)

		try {
			const fileExists = await fs
				.access(NodusRecommendedModelsFilePath)
				.then(() => true)
				.catch(() => false)
			if (fileExists) {
				const fileContents = await fs.readFile(NodusRecommendedModelsFilePath, "utf8")
				const parsed = JSON.parse(fileContents)
				if (parsed) {
					result = parsed
					Logger.log("Loaded Nodus recommended models from cache")
				}
			}
		} catch (cacheError) {
			Logger.error("Error reading Nodus recommended models from cache:", cacheError)
		}
	}

	// Avoid pinning empty results in memory for the full TTL after a transient API/cache miss.
	if (result.recommended.length > 0 || result.free.length > 0) {
		inMemoryCache = { data: result, timestamp: Date.now() }
	}
	return result
}
