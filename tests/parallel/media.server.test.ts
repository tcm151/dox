import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { expect, it, vi } from "vitest"
import type { AppSettings, Image, Post, User } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { emptyTrash } from "../../server/utils/mediaCleanup"
import { validateMediaContent } from "../../server/utils/mediaFormat"
import { expectStatus, fetch, grabExampleServer, grabUser, uniqueTestIp } from "../utils/test-server"

const admin = await grabUser("admin")
const exampleServer = await grabExampleServer("default")
const member = exampleServer.users.sampleUser04

function createMp3Frame() {
    const frame = Buffer.alloc(417)
    frame.writeUInt32BE(0xfffb9000, 0)
    return frame
}

it("requires authentication and confirmation to upload images", async () => {
    const unauthenticatedResponse = await fetch("/api/image/upload", { method: "POST" })
    expectStatus(unauthenticatedResponse, 401)

    const form = new FormData()
    const unconfirmedResponse = await member.fetchRaw("/api/image/upload", {
        method: "POST",
        body: form,
    })
    expectStatus(unconfirmedResponse, 403)

    const emptyFormResponse = await admin.fetchRaw("/api/image/upload", {
        method: "POST",
        body: form,
    })
    expectStatus(emptyFormResponse, 400)
})

it("rejects cross-category, mislabeled, and invalid media before charging tokens", async () => {
    const settings = await admin.fetch<AppSettings>("/api/settings/default")
    expect(settings.media.images.enabled).toBe(true)
    expect(settings.media.audio.enabled).toBe(false)

    const before = await admin.fetch<User>("/api/profile/authenticate")
    const png = await readFile(join(process.cwd(), "public", "images", "surrealdb-icon.png"))
    const mp3 = createMp3Frame()
    expect(await validateMediaContent("image", "image/png", png)).toBe("png")
    expect(await validateMediaContent("audio", "audio/mpeg", mp3)).toBe("mp3")
    await expect(validateMediaContent("audio", "audio/mpeg", Buffer.from("ID3"))).rejects.toThrow()

    const invalidUploads = [
        { type: "audio/mpeg", data: mp3 },
        { type: "image/jpeg", data: png },
        { type: "image/png", data: Buffer.from("not an image") },
    ]
    for (const upload of invalidUploads) {
        const form = new FormData()
        form.append("file", new Blob([upload.data], { type: upload.type }), "invalid-media")
        const response = await fetch("/api/image/upload", {
            method: "POST",
            headers: { Authorization: admin.accessToken, "X-Forwarded-For": uniqueTestIp() },
            body: form,
        })
        expectStatus(response, 400)
    }

    const after = await admin.fetch<User>("/api/profile/authenticate")
    expect(after.tokens).toBe(before.tokens)
})

it("backs off failed cleanup entries so a later valid file is processed", async () => {
    const dataDirectory = process.env.CLASSICFORUM_TEST_DATA_DIRECTORY
    if (!dataDirectory) throw new Error("The isolated test data directory is unavailable.")

    const suffix = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`
    const cleanupRoot = await mkdtemp(join(dataDirectory, "media-cleanup-"))
    const failedIds = Array.from(
        { length: 101 },
        (_, index) => `mediaTrash:cleanupFailure${suffix}_${String(index).padStart(3, "0")}`,
    )
    const firstFailedId = failedIds[0]
    if (!firstFailedId) throw new Error("The cleanup failure fixture is empty.")
    const firstFailedMediaId = extractId(firstFailedId)
    if (!firstFailedMediaId) throw new Error(`Invalid test media ID: ${firstFailedId}`)
    const validId = `mediaTrash:cleanupValid${suffix}`
    const allIds = [...failedIds, validId]
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    class TestDatabaseQuery {
        private sql = ""
        private parameters: Record<string, unknown> = {}

        addSql(sql: string) {
            this.sql = sql
            return this
        }

        addRecord(key: string, value: string) {
            this.parameters[key] = value
            return this
        }

        addParameter(key: string, value: unknown) {
            this.parameters[key] = value
            return this
        }

        async queryAll<T>() {
            const results = await admin.query<Array<Array<T>>>(this.sql)
            return results[0] ?? []
        }

        async execute() {
            for (const [key, value] of Object.entries(this.parameters)) {
                const replacement = key === "media" ? String(value) : JSON.stringify(value)
                this.sql = this.sql.replace(`$${key}`, replacement)
            }
            await admin.query(this.sql)
        }
    }

    try {
        vi.stubGlobal("DatabaseQuery", TestDatabaseQuery)
        vi.stubGlobal("useRuntimeConfig", () => ({ data: { path: cleanupRoot } }))
        await admin.query([
            ...failedIds.map(id => `CREATE ONLY ${id} SET type = "image", extension = "mp3", time = time::now() - 2h;`),
            `CREATE ONLY ${validId} SET type = "image", extension = "png", time = time::now() - 1h;`,
        ].join("\n"))

        await mkdir(join(cleanupRoot, "image"), { recursive: true })
        for (const id of failedIds) {
            const mediaId = extractId(id)
            if (!mediaId) throw new Error(`Invalid test media ID: ${id}`)
            const filePath = join(cleanupRoot, "image", `${mediaId}.mp3`)
            await mkdir(filePath)
            await writeFile(join(filePath, "retain"), "not a removable file")
        }

        const validMediaId = extractId(validId)
        if (!validMediaId) throw new Error(`Invalid test media ID: ${validId}`)
        const validFilePath = join(cleanupRoot, "image", `${validMediaId}.png`)
        await writeFile(validFilePath, "valid cleanup target")

        await emptyTrash()
        await emptyTrash()

        await expect(access(validFilePath)).rejects.toMatchObject({ code: "ENOENT" })
        await expect(access(join(cleanupRoot, "image", `${firstFailedMediaId}.mp3`, "retain"))).resolves.toBeUndefined()
        const remainingFailures = await admin.query<Array<Array<{ attempts: number, lastError: string, retryAfter: string }>>>(
            `SELECT attempts, lastError, retryAfter FROM mediaTrash WHERE id IN [${failedIds.join(", ")}];`,
        )
        expect(remainingFailures[0]).toHaveLength(101)
        expect(remainingFailures[0]?.every(item =>
            item.attempts === 1 && item.lastError.length > 0 && Date.parse(item.retryAfter) > Date.now(),
        )).toBe(true)

        const removedRecord = await admin.query<Array<Array<{ id: string }>>>(
            `SELECT id FROM mediaTrash WHERE id = ${validId};`,
        )
        expect(removedRecord[0]).toEqual([])
    }
    finally {
        vi.unstubAllGlobals()
        errorSpy.mockRestore()
        await admin.query(allIds.map(id => `DELETE ${id};`).join("\n"))
        await rm(cleanupRoot, { recursive: true, force: true })
    }
})

it("uploads an image, charges tokens, and refunds them on deletion", async () => {
    const before = await admin.fetch("/api/profile/authenticate")
    const bytes = await readFile(join(process.cwd(), "public", "images", "surrealdb-icon.png"))
    const form = new FormData()
    form.append("file", new Blob([bytes], { type: "image/png" }), "surrealdb-icon.png")
    let imageId: string | undefined
    let imageDeleted = false

    try {
        const uploadResponse = await admin.fetchRaw<{ media: Image, tokens: number }>("/api/image/upload", {
            method: "POST",
            body: form,
        })
        expectStatus(uploadResponse, 200)

        const uploaded = uploadResponse._data!
        imageId = extractId(uploaded.media.id)
        expect(imageId).toBeDefined()
        expect(uploaded.media.user).toBe(admin.user.id)
        expect(uploaded.media.type).toBe("png")
        expect(uploaded.media.status).toBe("active")
        expect(uploaded.tokens).toBe(uploaded.media.tokens)
        expect(uploaded.tokens).toBeGreaterThan(0)

        const afterUpload = await admin.fetch("/api/profile/authenticate")
        expect(afterUpload.tokens).toBe(before.tokens - uploaded.tokens)

        const imageResponse = await fetch(`/cdn/image/${imageId}`)
        expectStatus(imageResponse, 200)
        const servedImage = new Uint8Array(await imageResponse.arrayBuffer())
        expect(Array.from(servedImage.slice(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10])

        const deleteResponse = await admin.fetchRaw(`/api/image/${imageId}/delete`)
        imageDeleted = deleteResponse.ok
        expectStatus(deleteResponse, 200)

        const afterDelete = await admin.fetch("/api/profile/authenticate")
        expect(afterDelete.tokens).toBe(before.tokens)
    }
    finally {
        if (imageId && !imageDeleted) {
            await admin.fetchRaw(`/api/image/${imageId}/delete`)
        }
    }
})

it("keeps an uploaded image while a post references it", async () => {
    const before = await admin.fetch("/api/profile/authenticate")
    const bytes = await readFile(join(process.cwd(), "public", "images", "surrealdb-icon.png"))
    const form = new FormData()
    form.append("file", new Blob([bytes], { type: "image/png" }), "surrealdb-icon.png")
    let imageId: string | undefined
    let postId: string | undefined
    let postDeleted = false

    try {
        const uploadResponse = await admin.fetchRaw<{ media: Image, tokens: number }>("/api/image/upload", {
            method: "POST",
            body: form,
        })
        expectStatus(uploadResponse, 200)
        const uploaded = uploadResponse._data!
        imageId = extractId(uploaded.media.id)
        expect(imageId).toBeDefined()

        const postResponse = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: {
                title: `Image attachment ${Date.now()}`,
                content: "This post keeps its image attached.",
                topics: [],
                images: [`image:${imageId}`],
            },
        })
        expectStatus(postResponse, 200)
        const createdPost = postResponse._data!
        postId = extractId(createdPost.id)
        const postDetailResponse = await fetch(`/api/post/${postId}`)
        expectStatus(postDetailResponse, 200)
        const post = await postDetailResponse.json() as Post
        expect(post.images.map(image => image.id)).toContain(`image:${imageId}`)

        const blockedDeleteResponse = await admin.fetchRaw(`/api/image/${imageId}/delete`)
        expectStatus(blockedDeleteResponse, 409)

        const stillAvailableResponse = await fetch(`/cdn/image/${imageId}`)
        expectStatus(stillAvailableResponse, 200)

        const deletePostResponse = await admin.fetchRaw(`/api/post/${postId}/delete`)
        postDeleted = deletePostResponse.ok
        expectStatus(deletePostResponse, 200)
        expect((await admin.fetch("/api/profile/authenticate")).tokens).toBe(before.tokens)
    }
    finally {
        if (postId && !postDeleted) {
            await admin.fetchRaw(`/api/post/${postId}/delete`)
        }
        else if (imageId && !postId) {
            await admin.fetchRaw(`/api/image/${imageId}/delete`)
        }
    }
})