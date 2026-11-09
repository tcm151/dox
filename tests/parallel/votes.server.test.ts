import { expect, it } from "vitest"
import type { Post } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { expectStatus, fetch, grabExampleServer, grabUser } from "../utils/test-server"

const admin = await grabUser("admin")
const exampleServer = await grabExampleServer("default")
const voter = exampleServer.users.sampleUser03

it("rejects votes without authentication", async () => {
    const response = await fetch("/api/vote/post:missing/positive", { method: "POST" })
    expectStatus(response, 401)
})

it("moves a user's vote between states and resets it", async () => {
    const postResponse = await admin.fetchRaw<Post>("/api/post/add", {
        method: "POST",
        body: {
            title: `Vote test ${Date.now()}`,
            content: "Temporary post for vote-state coverage.",
            topics: [],
            images: [],
        },
    })
    expectStatus(postResponse, 200)

    const post = postResponse._data!
    const postId = extractId(post.id)
    expect(postId).toBeDefined()

    const vote = async (kind: "positive" | "misleading" | "negative" | "reset") => voter.fetchRaw<Post["votes"]>(
        `/api/vote/${post.id}/${kind}`,
        {
            method: "POST",
        },
    )

    try {
        const positiveResponse = await vote("positive")
        expectStatus(positiveResponse, 200)
        const positiveVotes = positiveResponse._data!
        expect(positiveVotes.positive).toContain(voter.user.id)
        expect(positiveVotes.misleading).not.toContain(voter.user.id)
        expect(positiveVotes.negative).not.toContain(voter.user.id)

        const misleadingResponse = await vote("misleading")
        expectStatus(misleadingResponse, 200)
        const misleadingVotes = misleadingResponse._data!
        expect(misleadingVotes.positive).not.toContain(voter.user.id)
        expect(misleadingVotes.misleading).toContain(voter.user.id)
        expect(misleadingVotes.negative).not.toContain(voter.user.id)

        const negativeResponse = await vote("negative")
        expectStatus(negativeResponse, 200)
        const negativeVotes = negativeResponse._data!
        expect(negativeVotes.positive).not.toContain(voter.user.id)
        expect(negativeVotes.misleading).not.toContain(voter.user.id)
        expect(negativeVotes.negative).toContain(voter.user.id)

        const resetResponse = await vote("reset")
        expectStatus(resetResponse, 200)
        const resetVotes = resetResponse._data!
        expect(resetVotes.positive).not.toContain(voter.user.id)
        expect(resetVotes.misleading).not.toContain(voter.user.id)
        expect(resetVotes.negative).not.toContain(voter.user.id)
    }
    finally {
        const deleteResponse = await admin.fetchRaw(`/api/post/${postId}/delete`)
        expectStatus(deleteResponse, 200)
    }
})