import { expect, it } from "vitest"
import type { AppSettings, Post } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { expectStatus, fetch, grabExampleServer, grabUser } from "../utils/test-server"

const admin = await grabUser("admin")
const exampleServer = await grabExampleServer("default")
const voter = exampleServer.users.sampleUser03

it("enforces global and per-type voting settings while preserving vote resets", async () => {
    const originalSettings = await admin.fetch<AppSettings>("/api/settings/default")
    const settingsId = extractId(originalSettings.id)
    if (!settingsId) throw new Error("App settings record has no ID.")

    const updateVoting = (voting: AppSettings["voting"]) => admin.fetchRaw(
        `/api/admin/settings/${settingsId}/update`,
        { method: "POST", body: { ...originalSettings, voting } },
    )
    let post: Post | undefined
    let postId: string | undefined
    const vote = (kind: "positive" | "misleading" | "negative" | "reset") => voter.fetchRaw<Post["votes"]>(
        `/api/vote/${post!.id}/${kind}`,
        { method: "POST" },
    )
    const getPost = () => admin.fetch<Post>(`/api/post/${postId!}`)

    try {
        expectStatus(await updateVoting({ enabled: true, misleading: true, negative: true }), 200)

        const postResponse = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: {
                title: `Voting availability ${Date.now()}`,
                content: "Temporary post for voting-setting coverage.",
                topics: [],
                images: [],
            },
        })
        expectStatus(postResponse, 200)
        post = postResponse._data!
        postId = extractId(post.id)
        expect(postId).toBeDefined()

        expectStatus(await vote("positive"), 200)
        expectStatus(await updateVoting({ enabled: true, misleading: false, negative: true }), 200)
        expectStatus(await vote("misleading"), 403, "disabled misleading vote")
        expectStatus(await vote("positive"), 200, "positive votes stay enabled")
        expectStatus(await vote("negative"), 200, "negative votes stay enabled")

        expectStatus(await updateVoting({ enabled: true, misleading: false, negative: false }), 200)
        expectStatus(await vote("negative"), 403, "disabled negative vote")
        let currentPost = await getPost()
        expect(currentPost.votes.negative).toContain(voter.user.id)
        expectStatus(await vote("reset"), 200, "reset remains enabled while vote types are disabled")
        currentPost = await getPost()
        expect(currentPost.votes.positive).not.toContain(voter.user.id)
        expect(currentPost.votes.misleading).not.toContain(voter.user.id)
        expect(currentPost.votes.negative).not.toContain(voter.user.id)

        expectStatus(await updateVoting({ enabled: true, misleading: true, negative: true }), 200)
        expectStatus(await vote("misleading"), 200)
        expectStatus(await updateVoting({ enabled: false, misleading: true, negative: true }), 200)
        for (const kind of ["positive", "misleading", "negative"] as const) {
            expectStatus(await vote(kind), 403, `global voting disabled: ${kind}`)
        }

        currentPost = await getPost()
        expect(currentPost.votes.misleading).toContain(voter.user.id)
        expect(currentPost.votes.positive).not.toContain(voter.user.id)
        expect(currentPost.votes.negative).not.toContain(voter.user.id)

        for (const kind of ["positive", "misleading", "negative", "reset"] as const) {
            expectStatus(await fetch(`/api/vote/${post.id}/${kind}`, { method: "POST" }), 401, `unauthenticated ${kind}`)
        }

        expectStatus(await vote("reset"), 200, "reset remains enabled while all voting is disabled")
        currentPost = await getPost()
        expect(currentPost.votes.positive).not.toContain(voter.user.id)
        expect(currentPost.votes.misleading).not.toContain(voter.user.id)
        expect(currentPost.votes.negative).not.toContain(voter.user.id)
    }
    finally {
        try {
            if (postId) {
                expectStatus(await admin.fetchRaw(`/api/post/${postId}/delete`), 200, "delete test post")
            }
        }
        finally {
            expectStatus(await updateVoting(originalSettings.voting), 200, "restore voting settings")
        }
    }
})
