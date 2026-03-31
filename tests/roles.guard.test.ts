import { beforeEach, describe, expect, it, vi } from "vitest"
import { hasRole, requireRole } from "../shared/utils/roles"

describe("role guard", () => {
    beforeEach(() => {
        vi.unstubAllGlobals()
        vi.stubGlobal("createError", (input: any) => ({ ...input }))
    })

    it("returns true when user has role", () => {
        const user = { roles: ["developer"] } as any
        expect(hasRole(user, "developer")).toBe(true)
    })

    it("returns false when user does not have role", () => {
        const user = { roles: ["moderator"] } as any
        expect(hasRole(user, ["admin", "developer"])).toBe(false)
    })

    it("throws when role is required and missing", () => {
        const user = { roles: ["moderator"] } as any
        expect(() => requireRole(user, "admin")).toThrow("You do not have permission to do this.")
    })
})
