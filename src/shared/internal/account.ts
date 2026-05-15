/**
 * List of email domains that are considered trusted testers for Nodus.
 */
const NODUS_TRUSTED_TESTER_DOMAINS = ["fibilabs.tech"]

/**
 * Checks if the given email belongs to a nodus.bot user.
 * E.g. Emails ending with @nodus.bot
 */
export function isNodusBotUser(email: string): boolean {
	return email.endsWith("@nodus.bot")
}

export function isNodusInternalTester(email: string): boolean {
	return isNodusBotUser(email) || NODUS_TRUSTED_TESTER_DOMAINS.some((d) => email.endsWith(`@${d}`))
}
