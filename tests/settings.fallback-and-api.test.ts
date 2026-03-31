import { beforeEach, describe, expect, it, vi } from "vitest"

describe("settings defaults and API contract", () => {
    beforeEach(() => {
        vi.resetModules()
        vi.unstubAllGlobals()
    })

    it("uses default id when settingsManager.get is called without argument", async () => {
        const addSql = vi.fn().mockReturnThis()
        const addRecord = vi.fn().mockReturnThis()
        const queryOne = vi.fn().mockResolvedValue({ id: "appSettings:default" })

        vi.stubGlobal("DatabaseQuery", class {
            addSql = addSql
            addRecord = addRecord
            queryOne = queryOne
        })

        const { settingsManager } = await import("../server/utils/settings")
        await settingsManager.get()

        expect(addRecord).toHaveBeenCalledWith("settings", "appSettings:default")
    })

    it("settings API passes route param id to settings manager", async () => {
        const get = vi.fn().mockResolvedValue({ id: "appSettings:custom" })
        vi.stubGlobal("settingsManager", { get })
        vi.stubGlobal("defineEventHandler", (handler: any) => handler)

        const { default: handler } = await import("../server/api/settings/[id]/index")
        const event = { context: { params: { id: "custom" } } } as any
        const result = await handler(event)

        expect(get).toHaveBeenCalledWith("custom")
        expect(result).toMatchObject({ id: "appSettings:custom" })
    })

    it("admin settings update endpoint writes using namespaced id", async () => {
        const update = vi.fn().mockResolvedValue({ id: "appSettings:default" })
        const requireRole = vi.fn()
        vi.stubGlobal("settingsManager", { update })
        vi.stubGlobal("authenticateRequest", vi.fn().mockResolvedValue({ roles: ["admin"] }))
        vi.stubGlobal("requireRole", requireRole)
        vi.stubGlobal("readBody", vi.fn().mockResolvedValue({ voting: { enabled: true } }))
        vi.stubGlobal("defineEventHandler", (handler: any) => handler)

        const { default: handler } = await import("../server/api/admin/settings/[id]/update")
        await handler({ context: { params: { id: "default" } } } as any)

        expect(requireRole).toHaveBeenCalled()
        expect(update).toHaveBeenCalledWith("appSettings:default", { voting: { enabled: true } })
    })
})
