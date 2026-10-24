import { expect, it } from "vitest"
import { fetch, grabUser } from "../test-server"
import { extractId } from "../../shared/utils/records"
import type { Post } from "../../shared/types"

const admin = await grabUser("admin")
const title = `Integration test post ${Date.now()}`
const content = "Published by the sequential API integration test."
const postRequest = {
    title,
    content,
    topics: [],
    images: [],
}

it("rejects post publishing without authentication", async () => {
    const response = await fetch("/api/post/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postRequest),
    })

    expect(response.status).toBe(401)
})

it("publishes an authenticated post", async () => {
    const response = await fetch("/api/post/add", {
        method: "POST",
        headers: {
            Authorization: admin.accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(postRequest),
    })
    expect(response.status).toBe(200)

    const post = await response.json() as Post
    expect(post.id).toMatch(/^post:/)
    expect(post.title).toBe(title)
    expect(post.content).toBe(content)
    expect(post.user).toBe(admin.user.id)

    const postId = extractId(post.id)
    expect(postId).toBeDefined()

    const deleteResponse = await fetch(`/api/post/${postId}/delete`, {
        headers: { Authorization: admin.accessToken },
    })
    expect(deleteResponse.status).toBe(200)
})