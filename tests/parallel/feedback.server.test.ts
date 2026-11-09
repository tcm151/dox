import { expect, it } from "vitest"
import type { Feedback } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { expectStatus, fetch, grabExampleServer, grabUser } from "../utils/test-server"

const admin = await grabUser("admin")
const exampleServer = await grabExampleServer("default")
const author = exampleServer.users.sampleUser04

it("requires an authenticated user to submit feedback and an admin to view it", async () => {
    const submitResponse = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Unauthenticated feedback" }),
    })
    expectStatus(submitResponse, 401)

    const listResponse = await author.fetchRaw("/api/feedback")
    expectStatus(listResponse, 403)
})

it("submits feedback, exposes it to admins, and records dismissal", async () => {
    const content = `Feedback test ${Date.now()}`
    let feedbackId: string | undefined

    try {
        const submitResponse = await author.fetchRaw<Feedback>("/api/feedback/submit", {
            method: "POST",
            body: { content },
        })
        expectStatus(submitResponse, 200)
        const feedback = submitResponse._data!
        feedbackId = extractId(feedback.id)
        expect(feedbackId).toBeDefined()
        expect(feedback.content).toBe(content)
        expect(feedback.dismissed).toBe(false)

        const listResponse = await admin.fetchRaw<Array<{
            id: string
            content: string
            dismissed: boolean
            user: { id: string }
        }>>("/api/feedback")
        expectStatus(listResponse, 200)
        const feedbackItems = listResponse._data!
        const listedFeedback = feedbackItems.find(item => item.id === feedback.id)
        expect(listedFeedback?.content).toBe(content)
        expect(listedFeedback?.dismissed).toBe(false)
        expect(listedFeedback?.user.id).toBe(author.user.id)

        const dismissResponse = await admin.fetchRaw<Feedback>(`/api/feedback/${feedbackId}/dismiss`, {
            method: "POST",
        })
        expectStatus(dismissResponse, 200)
        const dismissedFeedback = dismissResponse._data!
        expect(dismissedFeedback.dismissed).toBe(true)
    }
    finally {
        if (feedbackId) {
            await admin.query(`DELETE feedback:${feedbackId};`)
        }
    }
})