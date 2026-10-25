import { expect, it } from "vitest"
import { extractId } from "../../shared/utils/records"
import type { Thread, Topic } from "../../shared/types"
import { fetch, grabExampleServer, grabUser } from "../test-server"

const admin = await grabUser("admin")
const exampleServer = await grabExampleServer("default")
const threadAuthor = exampleServer.users.threadAuthor
const replyAuthor = exampleServer.users.commentAuthor

async function removeRecords(statements: string[]) {
    if (statements.length === 0) return

    const response = await fetch("/api/developer/database/query", {
        method: "POST",
        headers: {
            Authorization: admin.accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: statements.join("\n") }),
    })
    if (!response.ok) {
        throw new Error(`Failed to clean up thread test records: ${await response.text()}`)
    }
}

it("rejects thread replies without authentication", async () => {
    const response = await fetch("/api/thread/missing/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Unauthenticated reply" }),
    })
    expect(response.status).toBe(401)
})

it("creates a thread reply and notifies the thread author", async () => {
    const parentContent = `API smoke parent ${Date.now()}`
    const replyContent = `API smoke reply ${Date.now()}`
    let parentId: string | undefined
    let replyId: string | undefined

    try {
        const parentResponse = await fetch("/api/thread/add", {
            method: "POST",
            headers: {
                Authorization: threadAuthor.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content: parentContent, topics: [], images: [] }),
        })
        expect(parentResponse.status, "thread creation stage").toBe(200)
        const parent = await parentResponse.json() as Thread
        parentId = extractId(parent.id)
        expect(parentId, "created parent thread ID").toBeDefined()

        const replyResponse = await fetch(`/api/thread/${parentId}/reply`, {
            method: "POST",
            headers: {
                Authorization: replyAuthor.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content: replyContent }),
        })
        expect(replyResponse.status, "thread reply stage").toBe(200)
        const reply = await replyResponse.json() as Thread
        replyId = extractId(reply.id)
        expect(replyId).toBeDefined()
        expect(reply.user).toBe(replyAuthor.user.id)
        expect(reply.replyTo).toBe(parent.id)
        expect(reply.content).toBe(replyContent)

        const notificationsResponse = await fetch("/api/profile/notifications?dismissed=false&amount=10", {
            headers: { Authorization: threadAuthor.accessToken },
        })
        expect(notificationsResponse.status, "reply notification stage").toBe(200)
        const notificationResult = await notificationsResponse.json() as {
            notifications: Array<{ context: string, message: string }>
        }
        const notification = notificationResult.notifications.find(item => item.context === reply.id)
        expect(notification?.message).toContain(replyContent)
    }
    finally {
        await removeRecords([
            ...(replyId ? [`DELETE notification WHERE context = thread:${replyId};`] : []),
            ...(replyId ? [`DELETE thread:${replyId};`] : []),
            ...(parentId ? [`DELETE thread:${parentId};`] : []),
        ])
    }
})

it("removes a thread-only topic after its thread is deleted", async () => {
    const topicId = `deletedThread${Date.now()}`
    let threadId: string | undefined

    try {
        const response = await fetch("/api/thread/add", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: "Created by the topic thread deletion regression test.",
                topics: [`topic:${topicId}`],
                images: [],
            }),
        })
        expect(response.status, await response.clone().text()).toBe(200)
        const thread = await response.json() as Thread
        threadId = extractId(thread.id)
        expect(threadId).toBeDefined()

        const deleteResponse = await fetch(`/api/thread/${threadId}/delete`, {
            headers: { Authorization: admin.accessToken },
        })
        expect(deleteResponse.status, await deleteResponse.clone().text()).toBe(200)

        const topicsResponse = await fetch("/api/topic")
        expect(topicsResponse.status).toBe(200)
        const topics = await topicsResponse.json() as Topic[]
        expect(topics.some(topic => topic.id === `topic:${topicId}`)).toBe(false)
    }
    finally {
        await removeRecords([
            ...(threadId ? [`DELETE thread:${threadId};`] : []),
            `DELETE topic:${topicId};`,
        ])
    }
})