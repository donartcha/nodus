import { Mode } from "@shared/storage/types"
import { NodusAccountInfoCard } from "../NodusAccountInfoCard"
import NodusModelPicker from "../NodusModelPicker"

/**
 * Props for the NodusProvider component
 */
interface NodusProviderProps {
	showModelOptions: boolean
	isPopup?: boolean
	currentMode: Mode
	initialModelTab?: "recommended" | "free"
}

/**
 * The Nodus provider configuration component
 */
export const NodusProvider = ({ showModelOptions, isPopup, currentMode, initialModelTab }: NodusProviderProps) => {
	return (
		<div>
			{/* Nodus Account Info Card */}
			<div style={{ marginBottom: 14, marginTop: 4 }}>
				<NodusAccountInfoCard />
			</div>

			{showModelOptions && (
				<>
					<NodusModelPicker
						currentMode={currentMode}
						initialTab={initialModelTab}
						isPopup={isPopup}
						showProviderRouting={true}
					/>
				</>
			)}
		</div>
	)
}
