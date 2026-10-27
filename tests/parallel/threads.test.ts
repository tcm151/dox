import { expect, it } from "vitest"
import { extractId } from "../../shared/utils/records"
import { type Thread, type Topic, type User, type UserSettings } from "../../shared/types"
import { expectStatus, fetch, grabExampleServer, grabUser } from "../test-server"

const admin = await grabUser("admin")
const exampleServer = await grabExampleServer("default")
const threadAuthor = exampleServer.users.threadAuthor
const replyAuthor = exampleServer.users.commentAuthor

async function saveUserSettings(settings: UserSettings) {
    await threadAuthor.fetch("/api/profile/settings/update", {
        method: "PUT",
        body: settings,
    })
}

async function setNotificationPreference(enabled: boolean) {
    const settings = await threadAuthor.fetch<UserSettings>("/api/profile/settings")
    settings.notifications.inApp = enabled
    await saveUserSettings(settings)
}

it("rejects thread replies without authentication", async () => {
    const response = await fetch("/api/thread/missing/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Unauthenticated reply" }),
    })
    expectStatus(response, 401)
})

it("creates a thread reply and notifies the thread author", async () => {
    const parentContent = `API smoke parent ${Date.now()}`
    const replyContent = `API smoke reply ${Date.now()}`
    let parentId: string | undefined
    let replyId: string | undefined
    let disabledReplyId: string | undefined
    let resumedReplyId: string | undefined
    const originalSettings = await threadAuthor.fetch<UserSettings>("/api/profile/settings")

    try {
        const parentResponse = await threadAuthor.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content: parentContent, topics: [], images: [] },
        })
        expectStatus(parentResponse, 200, "thread creation stage")
        const parent = parentResponse._data!
        parentId = extractId(parent.id)
        expect(parentId, "created parent thread ID").toBeDefined()

        const replyResponse = await replyAuthor.fetchRaw<Thread>(`/api/thread/${parentId}/reply`, {
            method: "POST",
            body: { content: replyContent },
        })
        expectStatus(replyResponse, 200, "thread reply stage")
        const reply = replyResponse._data!
        replyId = extractId(reply.id)
        expect(replyId).toBeDefined()
        expect(reply.user).toBe(replyAuthor.user.id)
        expect(reply.replyTo).toBe(parent.id)
        expect(reply.content).toBe(replyContent)

        const notificationResult = await threadAuthor.fetch<{ notifications: Array<{ context: string, message: string }> }>("/api/profile/notifications?dismissed=false&amount=10")
        const notification = notificationResult.notifications.find(item => item.context === reply.id)
        expect(notification?.message).toContain(replyContent)

        await setNotificationPreference(false)
        const savedSettings = await threadAuthor.fetch<UserSettings>("/api/profile/settings")
        expect(savedSettings.ui).toEqual({ hoverAnimations: true, hintDuration: 2500 })

        const disabledReplyResponse = await replyAuthor.fetchRaw<Thread>(`/api/thread/${parentId}/reply`, {
            method: "POST",
            body: { content: `API smoke disabled reply ${Date.now()}` },
        })
        expectStatus(disabledReplyResponse, 200, "reply with notifications disabled")
        const disabledReply = disabledReplyResponse._data!
        disabledReplyId = extractId(disabledReply.id)

        const disabledNotifications = await threadAuthor.fetch<{ notifications: Array<{ context: string, message: string }> }>("/api/profile/notifications?dismissed=false&amount=20")
        expect(disabledNotifications.notifications.some(item => item.context === disabledReply.id)).toBe(false)

        await setNotificationPreference(true)
        const resumedReplyResponse = await replyAuthor.fetchRaw<Thread>(`/api/thread/${parentId}/reply`, {
            method: "POST",
            body: { content: `API smoke resumed reply ${Date.now()}` },
        })
        expectStatus(resumedReplyResponse, 200, "reply after notifications are re-enabled")
        const resumedReply = resumedReplyResponse._data!
        resumedReplyId = extractId(resumedReply.id)

        const resumedNotifications = await threadAuthor.fetch<{ notifications: Array<{ context: string, message: string }> }>("/api/profile/notifications?dismissed=false&amount=20")
        expect(resumedNotifications.notifications.some(item => item.context === resumedReply.id)).toBe(true)
    }
    finally {
        await saveUserSettings(originalSettings)
        const statements = [
            ...(resumedReplyId ? [`DELETE notification WHERE context = thread:${resumedReplyId};`] : []),
            ...(disabledReplyId ? [`DELETE notification WHERE context = thread:${disabledReplyId};`] : []),
            ...(replyId ? [`DELETE notification WHERE context = thread:${replyId};`] : []),
            ...(resumedReplyId ? [`DELETE thread:${resumedReplyId};`] : []),
            ...(disabledReplyId ? [`DELETE thread:${disabledReplyId};`] : []),
            ...(replyId ? [`DELETE thread:${replyId};`] : []),
            ...(parentId ? [`DELETE thread:${parentId};`] : []),
        ]
        if (statements.length > 0) await admin.query(statements.join("\n"))
    }
})

it("rejects thread awards when the sender has insufficient tokens", async () => {
    const senderBefore = await replyAuthor.fetch<User>("/api/profile/authenticate")
    const targetBefore = await threadAuthor.fetch<User>("/api/profile/authenticate")
    const content = `Award balance regression ${Date.now()}`
    let threadId: string | undefined

    try {
        await admin.query(`UPDATE ${replyAuthor.user.id} SET tokens = 0;`)

        const createResponse = await threadAuthor.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content, topics: [], images: [] },
        })
        expectStatus(createResponse, 200, "thread creation stage")
        const thread = createResponse._data!
        threadId = extractId(thread.id)

        const awardResponse = await replyAuthor.fetchRaw(`/api/thread/${threadId}/award`, { method: "POST" })
        expectStatus(awardResponse, 409)

        const senderAfter = await replyAuthor.fetch<User>("/api/profile/authenticate")
        const targetAfter = await threadAuthor.fetch<User>("/api/profile/authenticate")
        expect(senderAfter.tokens).toBe(0)
        expect(targetAfter.tokens).toBe(targetBefore.tokens)

        const threadResponse = await fetch(`/api/thread/${threadId}`)
        expectStatus(threadResponse, 200)
        const threadAfter = await threadResponse.json() as Thread
        expect(threadAfter.votes.awards).not.toContain(replyAuthor.user.id)
    }
    finally {
        await admin.query([
            `UPDATE ${replyAuthor.user.id} SET tokens = ${senderBefore.tokens};`,
            ...(threadId ? [`DELETE notification WHERE context = thread:${threadId};`, `DELETE thread:${threadId};`] : []),
        ].join("\n"))
    }
})

it("allows only one of two concurrent awards to the same thread", async () => {
    const senderBefore = await replyAuthor.fetch<User>("/api/profile/authenticate")
    const targetBefore = await threadAuthor.fetch<User>("/api/profile/authenticate")
    const content = `Concurrent award regression ${Date.now()}`
    let threadId: string | undefined

    try {
        const createResponse = await threadAuthor.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content, topics: [], images: [] },
        })
        expectStatus(createResponse, 200, "thread creation stage")
        const thread = createResponse._data!
        threadId = extractId(thread.id)

        const award = () => replyAuthor.fetchRaw(`/api/thread/${threadId}/award`, { method: "POST" })
        const responses = await Promise.all([award(), award()])
        const statuses = responses.map(response => response.status).sort()
        expect(statuses).toEqual([200, 409])

        const senderAfter = await replyAuthor.fetch<User>("/api/profile/authenticate")
        const targetAfter = await threadAuthor.fetch<User>("/api/profile/authenticate")
        expect(senderAfter.tokens).toBe(senderBefore.tokens - 256)
        expect(targetAfter.tokens).toBe(targetBefore.tokens + 256)

        const threadResponse = await fetch(`/api/thread/${threadId}`)
        expectStatus(threadResponse, 200)
        const threadAfter = await threadResponse.json() as Thread
        expect(threadAfter.votes.awards.filter(id => id === replyAuthor.user.id)).toHaveLength(1)
    }
    finally {
        await admin.query([
            `UPDATE ${replyAuthor.user.id} SET tokens = ${senderBefore.tokens};`,
            `UPDATE ${threadAuthor.user.id} SET tokens = ${targetBefore.tokens};`,
            ...(threadId ? [`DELETE notification WHERE context = thread:${threadId};`, `DELETE thread:${threadId};`] : []),
        ].join("\n"))
    }
})

it("removes a thread-only topic after its thread is deleted", async () => {
    const topicId = `deletedThread${Date.now()}`
    let threadId: string | undefined

    try {
        const response = await admin.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: {
                content: "Created by the topic thread deletion regression test.",
                topics: [`topic:${topicId}`],
                images: [],
            },
        })
        expectStatus(response, 200, "thread creation stage")
        const thread = response._data!
        threadId = extractId(thread.id)
        expect(threadId).toBeDefined()

        const deleteResponse = await admin.fetchRaw(`/api/thread/${threadId}/delete`)
        expectStatus(deleteResponse, 200, "thread deletion stage")

        const topicsResponse = await fetch("/api/topic")
        expectStatus(topicsResponse, 200)
        const topics = await topicsResponse.json() as Topic[]
        expect(topics.some(topic => topic.id === `topic:${topicId}`)).toBe(false)
    }
    finally {
        await admin.query([
            ...(threadId ? [`DELETE thread:${threadId};`] : []),
            `DELETE topic:${topicId};`,
        ].join("\n"))
    }
})