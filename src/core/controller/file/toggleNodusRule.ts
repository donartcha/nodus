import { getWorkspaceBasename } from "@core/workspace"
import type { ToggleNodusRuleRequest } from "@shared/proto/nodus/file"
import { RuleScope, ToggleNodusRules } from "@shared/proto/nodus/file"
import { telemetryService } from "@/services/telemetry"
import { Logger } from "@/shared/services/Logger"
import type { Controller } from "../index"

/**
 * Toggles a Nodus rule (enable or disable)
 * @param controller The controller instance
 * @param request The toggle request
 * @returns The updated Nodus rule toggles
 */
export async function toggleNodusRule(controller: Controller, request: ToggleNodusRuleRequest): Promise<ToggleNodusRules> {
	const { scope, rulePath, enabled } = request

	if (!rulePath || typeof enabled !== "boolean" || scope === undefined) {
		Logger.error("toggleNodusRule: Missing or invalid parameters", {
			rulePath,
			scope,
			enabled: typeof enabled === "boolean" ? enabled : `Invalid: ${typeof enabled}`,
		})
		throw new Error("Missing or invalid parameters for toggleNodusRule")
	}

	// Handle the three different scopes
	switch (scope) {
		case RuleScope.GLOBAL: {
			const toggles = controller.stateManager.getGlobalSettingsKey("globalNodusRulesToggles")
			toggles[rulePath] = enabled
			controller.stateManager.setGlobalState("globalNodusRulesToggles", toggles)
			break
		}
		case RuleScope.LOCAL: {
			const toggles = controller.stateManager.getWorkspaceStateKey("localNodusRulesToggles")
			toggles[rulePath] = enabled
			controller.stateManager.setWorkspaceState("localNodusRulesToggles", toggles)
			break
		}
		case RuleScope.REMOTE: {
			const toggles = controller.stateManager.getGlobalStateKey("remoteRulesToggles")
			toggles[rulePath] = enabled
			controller.stateManager.setGlobalState("remoteRulesToggles", toggles)
			break
		}
		default:
			throw new Error(`Invalid scope: ${scope}`)
	}

	// Track rule toggle telemetry with current task context
	if (controller.task?.ulid) {
		// Extract just the filename for privacy (no full paths)
		const ruleFileName = getWorkspaceBasename(rulePath, "Controller.toggleNodusRule")
		const isGlobal = scope === RuleScope.GLOBAL
		telemetryService.captureNodusRuleToggled(controller.task.ulid, ruleFileName, enabled, isGlobal)
	}

	// Get the current state to return in the response
	const globalToggles = controller.stateManager.getGlobalSettingsKey("globalNodusRulesToggles")
	const localToggles = controller.stateManager.getWorkspaceStateKey("localNodusRulesToggles")
	const remoteToggles = controller.stateManager.getGlobalStateKey("remoteRulesToggles")

	return ToggleNodusRules.create({
		globalNodusRulesToggles: { toggles: globalToggles },
		localNodusRulesToggles: { toggles: localToggles },
		remoteRulesToggles: { toggles: remoteToggles },
	})
}
