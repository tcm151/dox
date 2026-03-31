import { beforeEach, describe, expect, it, vi } from "vitest"

describe("admin privilege escalation guard", () => {
    beforeEach(() => {
        vi.resetModules()
        vi.unstubAllGlobals()
        vi.stubGlobal("defineEventHandler", (handler: any) => handler)
    })

    it("blocks non-admin from add/remove role even with crafted payload", async () => {
        const readBody = vi.fn().mockResolvedValue({ user: "user:1", role: "admin" })
        const queryOne = vi.fn()

        vi.stubGlobal("authenticateRequest", vi.fn().mockResolvedValue({ roles: ["moderator"] }))
        vi.stubGlobal("requireRole", vi.fn(() => { throw { status: 403, statusText: "forbidden" } }))
        vi.stubGlobal("readBody", readBody)
        vi.stubGlobal("DatabaseQuery", class {
            addSql() { return this }
            addRecord() { return this }
            addParameter() { return this }
            queryOne = queryOne
        })

        const { default: addHandler } = await import("../server/api/admin/role/add")
        const { default: removeHandler } = await import("../server/api/admin/role/remove")

        await expect(addHandler({ context: {} } as any)).rejects.toMatchObject({ status: 403 })
        await expect(removeHandler({ context: {} } as any)).rejects.toMatchObject({ status: 403 })
        expect(readBody).not.toHaveBeenCalled()
        expect(queryOne).not.toHaveBeenCalled()
    })

    it("allows admin role mutation flow", async () => {
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

        const { default: addHandler } = await import("../server/api/admin/role/add")
        const result = await addHandler({ context: {} } as any)

        expect(result).toEqual(["admin", "developer"])
        expect(queryOne).toHaveBeenCalled()
    })
})
