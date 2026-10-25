import { expect, it } from "vitest"
import { extractId } from "../../shared/utils/records"
import type { Thread, Topic, User } from "../../shared/types"
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

async function getProfile(accessToken: string) {
    const response = await fetch("/api/profile/authenticate", {
        headers: { Authorization: accessToken },
    })
    expect(response.status).toBe(200)
    return await response.json() as User
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

it("rejects thread awards when the sender has insufficient tokens", async () => {
    const senderBefore = await getProfile(replyAuthor.accessToken)
    const targetBefore = await getProfile(threadAuthor.accessToken)
    const content = `Award balance regression ${Date.now()}`
    let threadId: string | undefined

    try {
        const emptyBalanceResponse = await fetch("/api/developer/database/query", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: `UPDATE ${replyAuthor.user.id} SET tokens = 0;` }),
        })
        expect(emptyBalanceResponse.status, await emptyBalanceResponse.clone().text()).toBe(200)

        const createResponse = await fetch("/api/thread/add", {
            method: "POST",
            headers: {
                Authorization: threadAuthor.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content, topics: [], images: [] }),
        })
        expect(createResponse.status, await createResponse.clone().text()).toBe(200)
        const thread = await createResponse.json() as Thread
        threadId = extractId(thread.id)

        const awardResponse = await fetch(`/api/thread/${threadId}/award`, {
            method: "POST",
            headers: { Authorization: replyAuthor.accessToken },
        })
        expect(awardResponse.status).toBe(409)

        const senderAfter = await getProfile(replyAuthor.accessToken)
        const targetAfter = await getProfile(threadAuthor.accessToken)
        expect(senderAfter.tokens).toBe(0)
        expect(targetAfter.tokens).toBe(targetBefore.tokens)

        const threadResponse = await fetch(`/api/thread/${threadId}`)
        expect(threadResponse.status).toBe(200)
        const threadAfter = await threadResponse.json() as Thread
        expect(threadAfter.votes.awards).not.toContain(replyAuthor.user.id)
    }
    finally {
        await removeRecords([
            `UPDATE ${replyAuthor.user.id} SET tokens = ${senderBefore.tokens};`,
            ...(threadId ? [`DELETE notification WHERE context = thread:${threadId};`, `DELETE thread:${threadId};`] : []),
        ])
    }
})

it("allows only one of two concurrent awards to the same thread", async () => {
    const senderBefore = await getProfile(replyAuthor.accessToken)
    const targetBefore = await getProfile(threadAuthor.accessToken)
    const content = `Concurrent award regression ${Date.now()}`
    let threadId: string | undefined

    try {
        const createResponse = await fetch("/api/thread/add", {
            method: "POST",
            headers: {
                Authorization: threadAuthor.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content, topics: [], images: [] }),
        })
        expect(createResponse.status, await createResponse.clone().text()).toBe(200)
        const thread = await createResponse.json() as Thread
        threadId = extractId(thread.id)

        const award = () => fetch(`/api/thread/${threadId}/award`, {
            method: "POST",
            headers: { Authorization: replyAuthor.accessToken },
        })
        const responses = await Promise.all([award(), award()])
        const statuses = responses.map(response => response.status).sort()
        expect(statuses).toEqual([200, 409])

        const senderAfter = await getProfile(replyAuthor.accessToken)
        const targetAfter = await getProfile(threadAuthor.accessToken)
        expect(senderAfter.tokens).toBe(senderBefore.tokens - 256)
        expect(targetAfter.tokens).toBe(targetBefore.tokens + 256)

        const threadResponse = await fetch(`/api/thread/${threadId}`)
        expect(threadResponse.status).toBe(200)
        const threadAfter = await threadResponse.json() as Thread
        expect(threadAfter.votes.awards.filter(id => id === replyAuthor.user.id)).toHaveLength(1)
    }
    finally {
        await removeRecords([
            `UPDATE ${replyAuthor.user.id} SET tokens = ${senderBefore.tokens};`,
            `UPDATE ${threadAuthor.user.id} SET tokens = ${targetBefore.tokens};`,
            ...(threadId ? [`DELETE notification WHERE context = thread:${threadId};`, `DELETE thread:${threadId};`] : []),
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