import { beforeEach, describe, expect, it, vi } from "vitest"

describe("admin endpoint role enforcement", () => {
    beforeEach(() => {
        vi.resetModules()
        vi.unstubAllGlobals()
        vi.stubGlobal("defineEventHandler", (handler: any) => handler)
    })

    it("rejects non-admin role for role add endpoint", async () => {
        vi.stubGlobal("authenticateRequest", vi.fn().mockResolvedValue({ roles: ["moderator"] }))
        vi.stubGlobal("requireRole", vi.fn(() => { throw { status: 403, statusText: "forbidden" } }))
        vi.stubGlobal("readBody", vi.fn().mockResolvedValue({ user: "user:1", role: "developer" }))

        const { default: handler } = await import("../server/api/admin/role/add")
        await expect(handler({ context: {} } as any)).rejects.toMatchObject({ status: 403 })
    })

    it("allows admin role and returns updated roles", async () => {
        const queryOne = vi.fn().mockResolvedValue({ roles: ["admin", "developer"] })
        vi.stubGlobal("authenticateRequest", vi.fn().mockResolvedValue({ roles: ["admin"] }))
        vi.stubGlobal("requireRole", vi.fn())
        vi.stubGlobal("readBody", vi.fn().mockResolvedValue({ user: "user:1", role: "developer" }))
        vi.stubGlobal("DatabaseQuery", class {
            addSql() { return this }
            addRecord() { return this }
            addParameter() { return this }
            queryOne = queryOne
        })

        const { default: handler } = await import("../server/api/admin/role/add")
        const result = await handler({ context: {} } as any)

        expect(result).toEqual(["admin", "developer"])
    })
})
