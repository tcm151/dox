import { expect, it } from "vitest"
import type { Feedback } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { fetch, grabExampleServer, grabUser } from "../test-server"

const admin = await grabUser("admin")
const exampleServer = await grabExampleServer("default")
const author = exampleServer.users.sampleUser04

it("requires an authenticated user to submit feedback and an admin to view it", async () => {
    const submitResponse = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Unauthenticated feedback" }),
    })
    expect(submitResponse.status).toBe(401)

    const listResponse = await fetch("/api/feedback", {
        headers: { Authorization: author.accessToken },
    })
    expect(listResponse.status).toBe(403)
})

it("submits feedback, exposes it to admins, and records dismissal", async () => {
    const content = `Feedback test ${Date.now()}`
    let feedbackId: string | undefined

    try {
        const submitResponse = await fetch("/api/feedback/submit", {
            method: "POST",
            headers: {
                Authorization: author.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content }),
        })
        expect(submitResponse.status, await submitResponse.clone().text()).toBe(200)
        const feedback = await submitResponse.json() as Feedback
        feedbackId = extractId(feedback.id)
        expect(feedbackId).toBeDefined()
        expect(feedback.content).toBe(content)
        expect(feedback.dismissed).toBe(false)

        const listResponse = await fetch("/api/feedback", {
            headers: { Authorization: admin.accessToken },
        })
        expect(listResponse.status).toBe(200)
        const feedbackItems = await listResponse.json() as Array<{
            id: string
            content: string
            dismissed: boolean
            user: { id: string }
        }>
        const listedFeedback = feedbackItems.find(item => item.id === feedback.id)
        expect(listedFeedback?.content).toBe(content)
        expect(listedFeedback?.dismissed).toBe(false)
        expect(listedFeedback?.user.id).toBe(author.user.id)

        const dismissResponse = await fetch(`/api/feedback/${feedbackId}/dismiss`, {
            method: "POST",
            headers: { Authorization: admin.accessToken },
        })
        expect(dismissResponse.status, await dismissResponse.clone().text()).toBe(200)
        const dismissedFeedback = await dismissResponse.json() as Feedback
        expect(dismissedFeedback.dismissed).toBe(true)
    }
    finally {
        if (feedbackId) {
            const cleanupResponse = await fetch("/api/developer/database/query", {
                method: "POST",
                headers: {
                    Authorization: admin.accessToken,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query: `DELETE feedback:${feedbackId};` }),
            })
            expect(cleanupResponse.status, await cleanupResponse.clone().text()).toBe(200)
        }
    }
})