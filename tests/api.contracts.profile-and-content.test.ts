import { beforeEach, describe, expect, it, vi } from "vitest"

describe("api contract checks", () => {
    beforeEach(() => {
        vi.resetModules()
        vi.unstubAllGlobals()
        vi.stubGlobal("defineEventHandler", (handler: any) => handler)
    })

    it("profile endpoint returns authenticated user shape", async () => {
        vi.stubGlobal("authenticateRequest", vi.fn().mockResolvedValue({
            id: "user:1",
            name: "tester",
            roles: ["developer"],
            topics: [],
            followers: [],
            following: [],
            votes: { positive: [], misleading: [], negative: [], awards: [], saves: [] },
        }))

        const { default: handler } = await import("../server/api/profile/index")
        const result = await handler({ context: {} } as any)

        expect(result).toHaveProperty("id")
        expect(result).toHaveProperty("name")
        expect(result).toHaveProperty("roles")
    })

    it("post add endpoint sends expected fields to persistence layer", async () => {
        const addParameter = vi.fn().mockReturnThis()
        const addRecords = vi.fn().mockReturnThis()
        const addRecord = vi.fn().mockReturnThis()
        const queryOne = vi.fn().mockResolvedValue({ id: "post:1", title: "Title" })

        vi.stubGlobal("authenticateRequest", vi.fn().mockResolvedValue({ id: "user:1" }))
        vi.stubGlobal("readBody", vi.fn().mockResolvedValue({
            title: "Title",
            content: "Content",
            topics: ["topic:1"],
            images: [],
        }))
        vi.stubGlobal("DatabaseQuery", class {
            addSql() { return this }
            addRecord = addRecord
            addParameter = addParameter
            addRecords = addRecords
            queryOne = queryOne
        })
        vi.stubGlobal("defineEventHandler", (handler: any) => handler)

        const { default: handler } = await import("../server/api/post/add")
        await handler({ context: {} } as any)

        expect(addRecord).toHaveBeenCalledWith("user", "user:1")
        expect(addParameter).toHaveBeenCalledWith("title", "Title")
        expect(addParameter).toHaveBeenCalledWith("content", "Content")
        expect(addRecords).toHaveBeenCalledWith("topics", ["topic:1"])
        expect(addRecords).toHaveBeenCalledWith("images", [])
    })

    it("post add endpoint defaults images to empty array when omitted", async () => {
        const addRecords = vi.fn().mockReturnThis()

        vi.stubGlobal("authenticateRequest", vi.fn().mockResolvedValue({ id: "user:1" }))
        vi.stubGlobal("readBody", vi.fn().mockResolvedValue({
            title: "Title",
            content: "Content",
            topics: ["topic:1"],
        }))
        vi.stubGlobal("DatabaseQuery", class {
            addSql() { return this }
            addRecord() { return this }
            addParameter() { return this }
            addRecords = addRecords
            queryOne() { return Promise.resolve({ id: "post:1" }) }
        })

        const { default: handler } = await import("../server/api/post/add")
        await handler({ context: {} } as any)

        expect(addRecords).toHaveBeenCalledWith("images", [])
    })
})
