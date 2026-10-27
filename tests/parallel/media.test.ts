import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { expect, it } from "vitest"
import type { Image, Post } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { expectStatus, fetch, grabExampleServer, grabUser } from "../test-server"

const admin = await grabUser("admin")
const exampleServer = await grabExampleServer("default")
const member = exampleServer.users.sampleUser04

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