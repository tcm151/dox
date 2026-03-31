import { beforeEach, describe, expect, it, vi } from "vitest"

const fsMock = vi.hoisted(() => ({
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
}))

vi.mock("node:fs", () => ({ default: fsMock }))

describe("media rollback safety", () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        vi.unstubAllGlobals()
        vi.stubGlobal("createError", (input: any) => ({ ...input }))
        vi.stubGlobal("ENV", { isDevelopment: () => true })
        vi.stubGlobal("extractId", () => "media-id")
    })

    it("restores tokens and deletes media record when file write fails", async () => {
        const addRecord = vi.fn().mockReturnThis()
        const execute = vi.fn().mockResolvedValue(undefined)

        fsMock.existsSync.mockReturnValue(true)
        fsMock.writeFileSync.mockImplementation(() => {
            throw new Error("disk full")
        })

        vi.stubGlobal("DatabaseQuery", class {
            addSql() { return this }
            addRecord = addRecord
            execute = execute
        })

        const { writeMedia } = await import("../server/utils/media")

        await expect(writeMedia(
            { id: "user:1" } as any,
            { id: "image:1", type: "png", tokens: 10 } as any,
            new Uint8Array([1, 2, 3]) as any,
            "image"
        )).rejects.toMatchObject({ status: 500 })

        expect(addRecord).toHaveBeenCalledWith("media", "image:1")
        expect(addRecord).toHaveBeenCalledWith("user", "user:1")
        expect(execute).toHaveBeenCalled()
    })
})
