import { describe, expect, it, vi } from "vitest"
import { Validator } from "../shared/utils/validation"

describe("validation boundary behavior", () => {
    it("passes when values satisfy constraints", () => {
        vi.stubGlobal("createError", (input: any) => ({ ...input }))

        expect(() => {
            new Validator("post")
                .test("valid-title", v => v.length >= 4, "title too short")
                .match("post:abc", "record.id")
                .confirm()
        }).not.toThrow()
    })

    it("throws with aggregated messages when constraints fail", () => {
        vi.stubGlobal("createError", (input: any) => ({ ...input }))

        expect(() => {
            new Validator("post")
                .test("x", v => v.length >= 4, "title too short")
                .match("bad id", "record.id")
                .confirm()
        }).toThrow()
    })
})
