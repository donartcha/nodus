import { NodusMessage } from "@shared/ExtensionMessage"
import { memo } from "react"
import CreditLimitError from "@/components/chat/CreditLimitError"
import SpendLimitError from "@/components/chat/SpendLimitError"
import { Button } from "@/components/ui/button"
import { useNodusAuth, useNodusSignIn } from "@/context/NodusAuthContext"
import { NodusError, NodusErrorType } from "../../../../src/services/error/NodusError"

const _errorColor = "var(--vscode-errorForeground)"

interface ErrorRowProps {
	message: NodusMessage
	errorType: "error" | "mistake_limit_reached" | "diff_error" | "NodusIGNORE_ERROR"
	apiRequestFailedMessage?: string
	apiReqStreamingFailedMessage?: string
}

const ErrorRow = memo(({ message, errorType, apiRequestFailedMessage, apiReqStreamingFailedMessage }: ErrorRowProps) => {
	const { NodusUser } = useNodusAuth()
	const rawApiError = apiRequestFailedMessage || apiReqStreamingFailedMessage

	const { isLoginLoading, handleSignIn } = useNodusSignIn()

	const renderErrorContent = () => {
		switch (errorType) {
			case "error":
			case "mistake_limit_reached":
				// Handle API request errors with special error parsing
				if (rawApiError) {
					// FIXME: NodusError parsing should not be applied to non-Nodus providers, but it seems we're using NodusErrorMessage below in the default error display
					const NodusError = NodusError.parse(rawApiError)
					const errorMessage = NodusError?._error?.message || NodusError?.message || rawApiError
					const requestId = NodusError?._error?.request_id
					const providerId = NodusError?.providerId || NodusError?._error?.providerId
					const isNodusProvider = providerId === "Nodus"
					const errorCode = NodusError?._error?.code

					if (NodusError?.isErrorType(NodusErrorType.Balance)) {
						const errorDetails = NodusError._error?.details
						return (
							<CreditLimitError
								buyCreditsUrl={errorDetails?.buy_credits_url}
								currentBalance={errorDetails?.current_balance}
								message={errorDetails?.message}
								totalPromotions={errorDetails?.total_promotions}
								totalSpent={errorDetails?.total_spent}
							/>
						)
					}

					if (NodusError?.isErrorType(NodusErrorType.SpendLimit)) {
						const d = NodusError._error?.details
						return (
							<SpendLimitError
								budgetPeriod={d?.budget_period}
								limitUsd={d?.limit_usd}
								message={d?.message || errorMessage}
								resetsAt={d?.resets_at}
								spentUsd={d?.spent_usd}
							/>
						)
					}

					if (NodusError?.isErrorType(NodusErrorType.RateLimit)) {
						return (
							<p className="m-0 whitespace-pre-wrap text-error wrap-anywhere">
								{errorMessage}
								{requestId && <div>Request ID: {requestId}</div>}
							</p>
						)
					}

					if (NodusError?.isErrorType(NodusErrorType.QuotaExceeded)) {
						const detailMessage = NodusError?._error?.details?.message || errorMessage
						return <p className="m-0 whitespace-pre-wrap text-error wrap-anywhere">{detailMessage}</p>
					}

					if (NodusError?.isErrorType(NodusErrorType.Auth) && isNodusProvider) {
						return !NodusUser ? (
							// User is using Nodus provider and is not logged in
							<div className="flex flex-col gap-3">
								<div className="flex items-center justify-center rounded border border-neutral-500/30 bg-vscode-editor-background p-6 text-center text-vscode-foreground">
									Whoops looks like you're logged out – click below to sign in
								</div>
								<Button className="w-full" disabled={isLoginLoading} onClick={handleSignIn}>
									Sign in to Nodus
									{isLoginLoading && (
										<span className="ml-1 animate-spin">
											<span className="codicon codicon-refresh" />
										</span>
									)}
								</Button>
							</div>
						) : (
							// Don't show sign in button after the user has logged in, just ask them to retry
							<div className="mt-4">
								<span className="text-description">(Click "Retry" below)</span>
							</div>
						)
					}

					return (
						<p className="m-0 whitespace-pre-wrap text-error wrap-anywhere flex flex-col gap-3">
							{/* Display the well-formatted error extracted from the NodusError instance */}

							<header>
								{providerId && <span className="uppercase">[{providerId}] </span>}
								{errorCode && <span>{errorCode}</span>}
								{errorMessage}
								{requestId && <div>Request ID: {requestId}</div>}
							</header>

							{/* Windows Powershell Issue */}
							{errorMessage?.toLowerCase()?.includes("powershell") && (
								<div>
									It seems like you're having Windows PowerShell issues, please see this{" "}
									<a
										className="underline text-inherit"
										href="https://github.com/Nodus/Nodus/wiki/TroubleShooting-%E2%80%90-%22PowerShell-is-not-recognized-as-an-internal-or-external-command%22">
										troubleshooting guide
									</a>
									.
								</div>
							)}

							{/* Display raw API error if different from parsed error message */}
							{errorMessage !== rawApiError && <div>{rawApiError}</div>}

							<div className="mt-4">
								<span className="text-description">(Click "Retry" below)</span>
							</div>
						</p>
					)
				}

				// Regular error message
				return <p className="m-0 mt-0 whitespace-pre-wrap text-error wrap-anywhere">{message.text}</p>

			case "diff_error":
				return (
					<div className="flex flex-col p-2 rounded text-xs opacity-80 bg-quote text-foreground">
						<div>The model used search patterns that don't match anything in the file. Retrying...</div>
					</div>
				)

			case "NodusIGNORE_ERROR":
				return (
					<div className="flex flex-col p-2 rounded text-xs opacity-80 bg-quote text-foreground">
						<div>
							Nodus tried to access <code>{message.text}</code> which is blocked by the <code>.Nodusignore</code>
							file.
						</div>
					</div>
				)

			default:
				return null
		}
	}

	// For diff_error and NodusIGNORE_ERROR, we don't show the header separately
	if (errorType === "diff_error" || errorType === "NodusIGNORE_ERROR") {
		return renderErrorContent()
	}

	// For other error types, show header + content
	return renderErrorContent()
})

export default ErrorRow
