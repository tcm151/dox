import { beforeEach, describe, expect, it, vi } from "vitest"

describe("startup migrations", () => {
    beforeEach(() => {
        vi.resetModules()
        vi.unstubAllGlobals()
    })

    it("executes schema and migration SQL on startup", async () => {
        const addSql = vi.fn().mockReturnThis()
        const execute = vi.fn().mockResolvedValue([true])

        vi.stubGlobal("defineNitroPlugin", (plugin: any) => plugin)
        vi.stubGlobal("createError", (input: any) => ({ ...input }))
        vi.stubGlobal("useRuntimeConfig", () => ({ surreal: { admin: {} } }))
        vi.stubGlobal("useStorage", () => ({ getItem: vi.fn().mockResolvedValue("DEFINE TABLE user;") }))
        vi.stubGlobal("DatabaseQuery", class {
            addSql = addSql
            addParameter() { return this }
            execute = execute
        })

        const plugin = (await import("../server/plugins/01.migrations.server")).default
        await plugin()

        expect(addSql).toHaveBeenCalled()
        expect(execute).toHaveBeenCalled()
    })

    it("can run repeatedly without throwing", async () => {
        const execute = vi.fn().mockResolvedValue([true])

        vi.stubGlobal("defineNitroPlugin", (plugin: any) => plugin)
        vi.stubGlobal("createError", (input: any) => ({ ...input }))
        vi.stubGlobal("useRuntimeConfig", () => ({ surreal: { admin: {} } }))
        vi.stubGlobal("useStorage", () => ({ getItem: vi.fn().mockResolvedValue("DEFINE TABLE user;") }))
        vi.stubGlobal("DatabaseQuery", class {
            addSql() { return this }
            addParameter() { return this }
            execute = execute
        })

        const plugin = (await import("../server/plugins/01.migrations.server")).default
        await expect(plugin()).resolves.toBeUndefined()
        await expect(plugin()).resolves.toBeUndefined()
    })
})
