import { describe, it } from "mocha"
import "should"
import { NodusError, NodusErrorType } from "../NodusError"

describe("NodusError", () => {
	describe("getErrorType", () => {
		it("should return QuotaExceeded when code is INFERENCE_CAP_ERROR", () => {
			const err = new NodusError({ message: "Inference cap reached", code: "INFERENCE_CAP_ERROR" })
			NodusError.getErrorType(err)!.should.equal(NodusErrorType.QuotaExceeded)
		})
	})
})
