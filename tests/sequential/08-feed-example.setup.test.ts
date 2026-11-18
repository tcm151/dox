import { expect, it } from "vitest"
import type { Comment, Post, Thread } from "../../shared/types"
import { expectStatus, grabExampleServer, grabUser } from "../utils/test-server"

const exampleServer = await grabExampleServer("default")
const admin = await grabUser("admin")
const postAuthor = exampleServer.users.postAuthor
const threadAuthor = exampleServer.users.threadAuthor

it("seeds representative feed content for browser tests", async () => {
    const postResponse = await postAuthor.fetchRaw<Post>("/api/post/add", {
        method: "POST",
        body: {
            title: "Browser suite sample post",
            content: "A representative post seeded for browser integration tests.",
            topics: [],
            images: [],
        },
    })
    expectStatus(postResponse, 200)
    const post = postResponse._data!
    expect(post.title).toBe("Browser suite sample post")

    const commentResponse = await postAuthor.fetchRaw<Comment>("/api/comment/add", {
        method: "POST",
        body: {
            context: post.id,
            replyTo: post.id,
            content: "A representative comment seeded for browser integration tests.",
        },
    })
    expectStatus(commentResponse, 200)
    expect(commentResponse._data?.content).toBe("A representative comment seeded for browser integration tests.")
    await admin.query(`DELETE notification WHERE context = ${commentResponse._data!.id};`)

    const threadResponse = await threadAuthor.fetchRaw<Thread>("/api/thread/add", {
        method: "POST",
        body: {
            content: "A representative thread seeded for browser integration tests.",
            topics: [],
            images: [],
        },
    })
    expectStatus(threadResponse, 200)
    expect(threadResponse._data?.content).toBe("A representative thread seeded for browser integration tests.")

    const galleryImageId = "browserSuiteSampleGallery"
    await admin.query(`CREATE ONLY image:${galleryImageId} SET user = ${admin.user.id}, type = "jpeg", origin = "https://example.invalid", tokens = 0, description = "A descriptive browser fixture image.";`)
    const galleryResponse = await admin.fetchRaw("/api/gallery/publish", {
        method: "POST",
        body: { images: [`image:${galleryImageId}`], title: "Browser sample gallery", description: "Browser suite sample gallery", topics: [] },
    })
    expectStatus(galleryResponse, 200)
})