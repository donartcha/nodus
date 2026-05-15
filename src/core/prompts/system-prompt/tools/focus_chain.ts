import { ModelFamily } from "@/shared/prompts"
import { NodusDefaultTool } from "@/shared/tools"
import type { NodusToolSpec } from "../spec"

// HACK: Placeholder to act as tool dependency
const generic: NodusToolSpec = {
	variant: ModelFamily.GENERIC,
	id: NodusDefaultTool.TODO,
	name: "focus_chain",
	description: "",
	contextRequirements: (context) => context.focusChainSettings?.enabled === true,
}

export const focus_chain_variants = [generic]
