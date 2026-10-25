import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { expect, it } from "vitest"
import type { Image, Post, User } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { fetch, grabExampleServer, grabUser } from "../test-server"

const admin = await grabUser("admin")
const exampleServer = await grabExampleServer("default")
const member = exampleServer.users.sampleUser04

async function getAdminProfile() {
    const response = await fetch("/api/profile/authenticate", {
        headers: { Authorization: admin.accessToken },
    })
    expect(response.status).toBe(200)
    return await response.json() as User
}

it("requires authentication and confirmation to upload images", async () => {
    const unauthenticatedResponse = await fetch("/api/image/upload", { method: "POST" })
    expect(unauthenticatedResponse.status).toBe(401)

    const form = new FormData()
    const unconfirmedResponse = await fetch("/api/image/upload", {
        method: "POST",
        headers: { Authorization: member.accessToken },
        body: form,
    })
    expect(unconfirmedResponse.status).toBe(403)

    const emptyFormResponse = await fetch("/api/image/upload", {
        method: "POST",
        headers: { Authorization: admin.accessToken },
        body: form,
    })
    expect(emptyFormResponse.status).toBe(400)
})

it("uploads an image, charges tokens, and refunds them on deletion", async () => {
    const before = await getAdminProfile()
    const bytes = await readFile(join(process.cwd(), "public", "images", "surrealdb-icon.png"))
    const form = new FormData()
    form.append("file", new Blob([bytes], { type: "image/png" }), "surrealdb-icon.png")
    let imageId: string | undefined
    let imageDeleted = false

    try {
        const uploadResponse = await fetch("/api/image/upload", {
            method: "POST",
            headers: { Authorization: admin.accessToken },
            body: form,
        })
        expect(uploadResponse.status, await uploadResponse.clone().text()).toBe(200)

        const uploaded = await uploadResponse.json() as { media: Image, tokens: number }
        imageId = extractId(uploaded.media.id)
        expect(imageId).toBeDefined()
        expect(uploaded.media.user).toBe(admin.user.id)
        expect(uploaded.media.type).toBe("png")
        expect(uploaded.tokens).toBe(uploaded.media.tokens)
        expect(uploaded.tokens).toBeGreaterThan(0)

        const afterUpload = await getAdminProfile()
        expect(afterUpload.tokens).toBe(before.tokens - uploaded.tokens)

        const imageResponse = await fetch(`/cdn/image/${imageId}`)
        expect(imageResponse.status).toBe(200)
        const servedImage = new Uint8Array(await imageResponse.arrayBuffer())
        expect(Array.from(servedImage.slice(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10])

        const deleteResponse = await fetch(`/api/image/${imageId}/delete`, {
            headers: { Authorization: admin.accessToken },
        })
        imageDeleted = deleteResponse.ok
        expect(deleteResponse.status, await deleteResponse.clone().text()).toBe(200)

        const afterDelete = await getAdminProfile()
        expect(afterDelete.tokens).toBe(before.tokens)
    }
    finally {
        if (imageId && !imageDeleted) {
            await fetch(`/api/image/${imageId}/delete`, {
                headers: { Authorization: admin.accessToken },
            })
        }
    }
})

it("keeps an uploaded image while a post references it", async () => {
    const before = await getAdminProfile()
    const bytes = await readFile(join(process.cwd(), "public", "images", "surrealdb-icon.png"))
    const form = new FormData()
    form.append("file", new Blob([bytes], { type: "image/png" }), "surrealdb-icon.png")
    let imageId: string | undefined
    let postId: string | undefined
    let postDeleted = false

    try {
        const uploadResponse = await fetch("/api/image/upload", {
            method: "POST",
            headers: { Authorization: admin.accessToken },
            body: form,
        })
        expect(uploadResponse.status, await uploadResponse.clone().text()).toBe(200)
        const uploaded = await uploadResponse.json() as { media: Image, tokens: number }
        imageId = extractId(uploaded.media.id)
        expect(imageId).toBeDefined()

        const postResponse = await fetch("/api/post/add", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: `Image attachment ${Date.now()}`,
                content: "This post keeps its image attached.",
                topics: [],
                images: [`image:${imageId}`],
            }),
        })
        expect(postResponse.status, await postResponse.clone().text()).toBe(200)
        const createdPost = await postResponse.json() as Post
        postId = extractId(createdPost.id)
        const postDetailResponse = await fetch(`/api/post/${postId}`)
        expect(postDetailResponse.status).toBe(200)
        const post = await postDetailResponse.json() as Post
        expect(post.images.map(image => image.id)).toContain(`image:${imageId}`)

        const blockedDeleteResponse = await fetch(`/api/image/${imageId}/delete`, {
            headers: { Authorization: admin.accessToken },
        })
        expect(blockedDeleteResponse.status, await blockedDeleteResponse.clone().text()).toBe(409)

        const stillAvailableResponse = await fetch(`/cdn/image/${imageId}`)
        expect(stillAvailableResponse.status).toBe(200)

        const deletePostResponse = await fetch(`/api/post/${postId}/delete`, {
            headers: { Authorization: admin.accessToken },
        })
        postDeleted = deletePostResponse.ok
        expect(deletePostResponse.status, await deletePostResponse.clone().text()).toBe(200)
        expect((await getAdminProfile()).tokens).toBe(before.tokens)
    }
    finally {
        if (postId && !postDeleted) {
            await fetch(`/api/post/${postId}/delete`, {
                headers: { Authorization: admin.accessToken },
            })
        }
        else if (imageId && !postId) {
            await fetch(`/api/image/${imageId}/delete`, {
                headers: { Authorization: admin.accessToken },
            })
        }
    }
})