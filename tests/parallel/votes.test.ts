import { expect, it } from "vitest"
import type { Post } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { fetch, grabExampleServer, grabUser } from "../test-server"

const admin = await grabUser("admin")
const exampleServer = await grabExampleServer("default")
const voter = exampleServer.users.sampleUser03

it("rejects votes without authentication", async () => {
    const response = await fetch("/api/vote/post:missing/positive", { method: "POST" })
    expect(response.status).toBe(401)
})

it("moves a user's vote between states and resets it", async () => {
    const postResponse = await fetch("/api/post/add", {
        method: "POST",
        headers: {
            Authorization: admin.accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            title: `Vote test ${Date.now()}`,
            content: "Temporary post for vote-state coverage.",
            topics: [],
            images: [],
        }),
    })
    expect(postResponse.status, await postResponse.clone().text()).toBe(200)

    const post = await postResponse.json() as Post
    const postId = extractId(post.id)
    expect(postId).toBeDefined()

    const vote = async (kind: "positive" | "misleading" | "negative" | "reset") => fetch(
        `/api/vote/${post.id}/${kind}`,
        {
            method: "POST",
            headers: { Authorization: voter.accessToken },
        },
    )

    try {
        const positiveResponse = await vote("positive")
        expect(positiveResponse.status, await positiveResponse.clone().text()).toBe(200)
        const positiveVotes = await positiveResponse.json() as Post["votes"]
        expect(positiveVotes.positive).toContain(voter.user.id)
        expect(positiveVotes.misleading).not.toContain(voter.user.id)
        expect(positiveVotes.negative).not.toContain(voter.user.id)

        const misleadingResponse = await vote("misleading")
        expect(misleadingResponse.status, await misleadingResponse.clone().text()).toBe(200)
        const misleadingVotes = await misleadingResponse.json() as Post["votes"]
        expect(misleadingVotes.positive).not.toContain(voter.user.id)
        expect(misleadingVotes.misleading).toContain(voter.user.id)
        expect(misleadingVotes.negative).not.toContain(voter.user.id)

        const negativeResponse = await vote("negative")
        expect(negativeResponse.status, await negativeResponse.clone().text()).toBe(200)
        const negativeVotes = await negativeResponse.json() as Post["votes"]
        expect(negativeVotes.positive).not.toContain(voter.user.id)
        expect(negativeVotes.misleading).not.toContain(voter.user.id)
        expect(negativeVotes.negative).toContain(voter.user.id)

        const resetResponse = await vote("reset")
        expect(resetResponse.status, await resetResponse.clone().text()).toBe(200)
        const resetVotes = await resetResponse.json() as Post["votes"]
        expect(resetVotes.positive).not.toContain(voter.user.id)
        expect(resetVotes.misleading).not.toContain(voter.user.id)
        expect(resetVotes.negative).not.toContain(voter.user.id)
    }
    finally {
        const deleteResponse = await fetch(`/api/post/${postId}/delete`, {
            headers: { Authorization: admin.accessToken },
        })
        expect(deleteResponse.status, await deleteResponse.clone().text()).toBe(200)
    }
})