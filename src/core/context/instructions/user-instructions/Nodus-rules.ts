import {
	ActivatedConditionalRule,
	getRemoteRulesTotalContentWithMetadata,
	getRuleFilesTotalContentWithMetadata,
	RULE_SOURCE_PREFIX,
	RuleLoadResultWithInstructions,
	synchronizeRuleToggles,
} from "@core/context/instructions/user-instructions/rule-helpers"
import { formatResponse } from "@core/prompts/responses"
import { ensureRulesDirectoryExists, GlobalFileNames } from "@core/storage/disk"
import { StateManager } from "@core/storage/StateManager"
import { NodusRulesToggles } from "@shared/nodus-rules"
import { fileExistsAtPath, isDirectory, readDirectory } from "@utils/fs"
import fs from "fs/promises"
import path from "path"
import { Controller } from "@/core/controller"
import { Logger } from "@/shared/services/Logger"
import { parseYamlFrontmatter } from "./frontmatter"
import { evaluateRuleConditionals, type RuleEvaluationContext } from "./rule-conditionals"

export const getGlobalNodusRules = async (
	globalNodusRulesFilePath: string,
	toggles: NodusRulesToggles,
	opts?: { evaluationContext?: RuleEvaluationContext },
): Promise<RuleLoadResultWithInstructions> => {
	let combinedContent = ""
	const activatedConditionalRules: ActivatedConditionalRule[] = []

	// 1. Get file-based rules
	if (await fileExistsAtPath(globalNodusRulesFilePath)) {
		if (await isDirectory(globalNodusRulesFilePath)) {
			try {
				const rulesFilePaths = await readDirectory(globalNodusRulesFilePath)
				// Note: ruleNamePrefix explicitly set to "global" for clarity (matches the default)
				const rulesFilesTotal = await getRuleFilesTotalContentWithMetadata(
					rulesFilePaths,
					globalNodusRulesFilePath,
					toggles,
					{
						evaluationContext: opts?.evaluationContext,
						ruleNamePrefix: "global",
					},
				)
				if (rulesFilesTotal.content) {
					combinedContent = rulesFilesTotal.content
					activatedConditionalRules.push(...rulesFilesTotal.activatedConditionalRules)
				}
			} catch {
				Logger.error(`Failed to read .Nodusrules directory at ${globalNodusRulesFilePath}`)
			}
		} else {
			Logger.error(`${globalNodusRulesFilePath} is not a directory`)
		}
	}

	// 2. Append remote config rules
	const stateManager = StateManager.get()
	const remoteConfigSettings = stateManager.getRemoteConfigSettings()
	const remoteRules = remoteConfigSettings.remoteGlobalRules || []
	const remoteToggles = stateManager.getGlobalStateKey("remoteRulesToggles") || {}
	const remoteResult = getRemoteRulesTotalContentWithMetadata(remoteRules, remoteToggles, {
		evaluationContext: opts?.evaluationContext,
	})
	if (remoteResult.content) {
		if (combinedContent) combinedContent += "\n\n"
		combinedContent += remoteResult.content
		activatedConditionalRules.push(...remoteResult.activatedConditionalRules)
	}

	// 3. Return formatted instructions
	if (!combinedContent) {
		return { instructions: undefined, activatedConditionalRules: [] }
	}

	return {
		instructions: formatResponse.NodusRulesGlobalDirectoryInstructions(globalNodusRulesFilePath, combinedContent),
		activatedConditionalRules,
	}
}

export const getLocalNodusRules = async (
	cwd: string,
	toggles: NodusRulesToggles,
	opts?: { evaluationContext?: RuleEvaluationContext },
): Promise<RuleLoadResultWithInstructions> => {
	const NodusRulesFilePath = path.resolve(cwd, GlobalFileNames.NodusRules)

	let instructions: string | undefined
	const activatedConditionalRules: ActivatedConditionalRule[] = []

	if (await fileExistsAtPath(NodusRulesFilePath)) {
		if (await isDirectory(NodusRulesFilePath)) {
			try {
				const rulesFilePaths = await readDirectory(NodusRulesFilePath, [
					[".Nodusrules", "workflows"],
					[".Nodusrules", "hooks"],
					[".Nodusrules", "skills"],
				])

				const rulesFilesTotal = await getRuleFilesTotalContentWithMetadata(rulesFilePaths, cwd, toggles, {
					evaluationContext: opts?.evaluationContext,
					ruleNamePrefix: "workspace",
				})
				if (rulesFilesTotal.content) {
					instructions = formatResponse.NodusRulesLocalDirectoryInstructions(cwd, rulesFilesTotal.content)
					activatedConditionalRules.push(...rulesFilesTotal.activatedConditionalRules)
				}
			} catch {
				Logger.error(`Failed to read .Nodusrules directory at ${NodusRulesFilePath}`)
			}
		} else {
			try {
				if (NodusRulesFilePath in toggles && toggles[NodusRulesFilePath] !== false) {
					const raw = (await fs.readFile(NodusRulesFilePath, "utf8")).trim()
					if (raw) {
						// Keep single-file .Nodusrules behavior consistent with directory/remote rules:
						// - Parse YAML frontmatter (fail-open on parse errors)
						// - Evaluate conditionals against the request's evaluation context
						const parsed = parseYamlFrontmatter(raw)
						if (parsed.hadFrontmatter && parsed.parseError) {
							// Fail-open: preserve the raw contents so the LLM can still see the author's intent.
							instructions = formatResponse.NodusRulesLocalFileInstructions(cwd, raw)
						} else {
							const { passed, matchedConditions } = evaluateRuleConditionals(
								parsed.data,
								opts?.evaluationContext ?? {},
							)
							if (passed) {
								instructions = formatResponse.NodusRulesLocalFileInstructions(cwd, parsed.body.trim())
								if (parsed.hadFrontmatter && Object.keys(matchedConditions).length > 0) {
									activatedConditionalRules.push({
										name: `${RULE_SOURCE_PREFIX.workspace}:${GlobalFileNames.NodusRules}`,
										matchedConditions,
									})
								}
							}
						}
					}
				}
			} catch {
				Logger.error(`Failed to read .Nodusrules file at ${NodusRulesFilePath}`)
			}
		}
	}

	return { instructions, activatedConditionalRules }
}

export async function refreshNodusRulesToggles(
	controller: Controller,
	workingDirectory: string,
): Promise<{
	globalToggles: NodusRulesToggles
	localToggles: NodusRulesToggles
}> {
	// Global toggles
	const globalNodusRulesToggles = controller.stateManager.getGlobalSettingsKey("globalNodusRulesToggles")
	const globalNodusRulesFilePath = await ensureRulesDirectoryExists()
	const updatedGlobalToggles = await synchronizeRuleToggles(globalNodusRulesFilePath, globalNodusRulesToggles)
	controller.stateManager.setGlobalState("globalNodusRulesToggles", updatedGlobalToggles)

	// Local toggles
	const localNodusRulesToggles = controller.stateManager.getWorkspaceStateKey("localNodusRulesToggles")
	const localNodusRulesFilePath = path.resolve(workingDirectory, GlobalFileNames.NodusRules)
	const updatedLocalToggles = await synchronizeRuleToggles(localNodusRulesFilePath, localNodusRulesToggles, "", [
		[".Nodusrules", "workflows"],
		[".Nodusrules", "hooks"],
		[".Nodusrules", "skills"],
	])
	controller.stateManager.setWorkspaceState("localNodusRulesToggles", updatedLocalToggles)

	return {
		globalToggles: updatedGlobalToggles,
		localToggles: updatedLocalToggles,
	}
}
