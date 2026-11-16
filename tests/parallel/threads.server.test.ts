import { expect, it } from "vitest"
import { extractId } from "../../shared/utils/records"
import { type Pin, type Thread, type Topic, type User, type UserSettings } from "../../shared/types"
import { expectStatus, fetch, grabExampleServer, grabUser } from "../utils/test-server"

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

it("rejects replies to missing threads", async () => {
    const response = await replyAuthor.fetchRaw("/api/thread/missing/reply", {
        method: "POST",
        body: { content: "Reply to a missing thread" },
    })
    expectStatus(response, 404)
})

it("denies thread archiving to members and toggles the archived state for admins", async () => {
    const content = `Thread archive flow ${Date.now()}`
    let threadId: string | undefined

    try {
        const createResponse = await threadAuthor.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content, topics: [], images: [] },
        })
        expectStatus(createResponse, 200, "thread creation stage")
        threadId = extractId(createResponse._data!.id)
        expect(threadId).toBeDefined()

        const memberResponse = await replyAuthor.fetchRaw(`/api/thread/${threadId}/archive`, { method: "POST" })
        expectStatus(memberResponse, 403, "member archive stage")
        const unchangedThread = await threadAuthor.fetch<Thread>(`/api/thread/${threadId}`)
        expect(unchangedThread.status).toBe("active")

        const archiveResponse = await admin.fetchRaw<Thread>(`/api/thread/${threadId}/archive`, { method: "POST" })
        expectStatus(archiveResponse, 200, "archive stage")
        expect(archiveResponse._data?.status).toBe("archived")

        const unarchiveResponse = await admin.fetchRaw<Thread>(`/api/thread/${threadId}/archive`, { method: "POST" })
        expectStatus(unarchiveResponse, 200, "unarchive stage")
        expect(unarchiveResponse._data?.status).toBe("active")

        const pinResponse = await admin.fetchRaw<Pin>(`/api/thread/${threadId}/pin`, { method: "POST" })
        expectStatus(pinResponse, 200, "app pin stage")
        const pins = await admin.query<Array<Pin[]>>(`SELECT * FROM pin WHERE item = thread:${threadId} AND scope = "app";`)
        expect(pins[0]).toHaveLength(1)
    }
    finally {
        if (threadId) await admin.query(`DELETE pin WHERE item = thread:${threadId}; DELETE thread:${threadId};`)
    }
})

it("allows admins to add thread tags without allowing members or authors to remove them", async () => {
    const content = `Thread tag permissions ${Date.now()}`
    let threadId: string | undefined

    try {
        const createResponse = await admin.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content, topics: [], images: [], tags: ["spoiler"] },
        })
        expectStatus(createResponse, 200, "thread creation stage")
        threadId = extractId(createResponse._data!.id)

        const deniedResponse = await replyAuthor.fetchRaw(`/api/thread/${threadId}/tag/add`, {
            method: "POST",
            body: { tag: "nsfw" },
        })
        expectStatus(deniedResponse, 403, "member authorization stage")

        const addResponse = await admin.fetchRaw(`/api/thread/${threadId}/tag/add`, {
            method: "POST",
            body: { tag: "nsfw" },
        })
        expectStatus(addResponse, 204, "admin tag addition stage")

        const editResponse = await admin.fetchRaw(`/api/thread/${threadId}/edit`, {
            method: "POST",
            body: { content: "Edited without changing tags.", tags: [] },
        })
        expectStatus(editResponse, 200, "author edit stage")
        expect((await admin.fetch<Thread>(`/api/thread/${threadId}`)).tags).toEqual(["spoiler", "nsfw"])
    }
    finally {
        if (threadId) {
            await admin.query(`DELETE notification WHERE context = thread:${threadId}; DELETE thread:${threadId};`)
        }
    }
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

it("removes a thread-only topic after soft-deleting its reply-bearing thread", async () => {
    const topicId = `deletedThread${Date.now()}`
    let threadId: string | undefined
    let replyId: string | undefined

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

        const replyResponse = await replyAuthor.fetchRaw<Thread>(`/api/thread/${threadId}/reply`, {
            method: "POST",
            body: { content: `Reply to topic thread ${Date.now()}` },
        })
        expectStatus(replyResponse, 200, "reply creation stage")
        replyId = extractId(replyResponse._data!.id)

        const deleteResponse = await admin.fetchRaw(`/api/thread/${threadId}/delete`)
        expectStatus(deleteResponse, 200, "thread deletion stage")
        const deletedThread = await admin.query<Array<Array<{ deleted: boolean, topics: string[] }>>>(
            `SELECT deleted, topics FROM thread:${threadId};`,
        )
        expect(deletedThread[0]?.[0]).toMatchObject({ deleted: true, topics: [] })

        const topicsResponse = await fetch("/api/topic")
        expectStatus(topicsResponse, 200)
        const topics = await topicsResponse.json() as Topic[]
        expect(topics.some(topic => topic.id === `topic:${topicId}`)).toBe(false)
    }
    finally {
        await admin.query([
            ...(replyId ? [`DELETE notification WHERE context = thread:${replyId};`, `DELETE thread:${replyId};`] : []),
            ...(threadId ? [`DELETE thread:${threadId};`] : []),
            `DELETE topic:${topicId};`,
        ].join("\n"))
    }
})

it("traverses replies and quotes and applies their target deletion policies", async () => {
    const createdThreadIds: string[] = []
    let quoteId: string | undefined

    try {
        const parentResponse = await threadAuthor.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content: `Reference parent ${Date.now()}`, topics: [], images: [] },
        })
        expectStatus(parentResponse, 200, "create reply parent")
        const parent = parentResponse._data!
        const parentId = extractId(parent.id)
        createdThreadIds.push(parentId)
        const replyContent = `Reference reply ${Date.now()}`

        const replyResponse = await replyAuthor.fetchRaw<Thread>(`/api/thread/${parentId}/reply`, {
            method: "POST",
            body: { content: replyContent },
        })
        expectStatus(replyResponse, 200, "create reply")
        const reply = replyResponse._data!
        createdThreadIds.push(extractId(reply.id))

        const parentWithReplies = await threadAuthor.fetch<Thread>(`/api/thread/${parentId}`)
        expect(parentWithReplies.replies.map(item => item.content)).toContain(replyContent)

        const quoteTargetResponse = await threadAuthor.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content: `Reference quote target ${Date.now()}`, topics: [], images: [] },
        })
        expectStatus(quoteTargetResponse, 200, "create quote target")
        const quoteTarget = quoteTargetResponse._data!
        const quoteTargetId = extractId(quoteTarget.id)
        createdThreadIds.push(quoteTargetId)

        const quoteResponse = await replyAuthor.fetchRaw<Thread>(`/api/thread/${quoteTargetId}/quote`, {
            method: "POST",
            body: { content: `Reference quote ${Date.now()}`, topics: [] },
        })
        expectStatus(quoteResponse, 200, "create quote")
        const quote = quoteResponse._data!
        quoteId = extractId(quote.id)
        createdThreadIds.push(quoteId)

        const targetWithQuotes = await threadAuthor.fetch<Thread>(`/api/thread/${quoteTargetId}`)
        expect(targetWithQuotes.quotes).toHaveLength(1)

        await expect(admin.query(`DELETE ONLY thread:${parentId};`)).rejects.toThrow()
        const parentAfterRejectedDelete = await threadAuthor.fetch<Thread>(`/api/thread/${parentId}`)
        expect(parentAfterRejectedDelete.replies.map(item => item.content)).toContain(replyContent)

        const deleteQuoteTarget = await threadAuthor.fetchRaw(`/api/thread/${quoteTargetId}/delete`, {
            method: "POST",
        })
        expectStatus(deleteQuoteTarget, 200, "delete quote target")
        const quoteAfterTargetDelete = await replyAuthor.fetch<Thread>(`/api/thread/${quoteId}`)
        expect(quoteAfterTargetDelete.quote).toBeUndefined()

        const deleteReplyParent = await threadAuthor.fetchRaw(`/api/thread/${parentId}/delete`, {
            method: "POST",
        })
        expectStatus(deleteReplyParent, 200, "delete reply parent")
        const deletedParent = await threadAuthor.fetch<Thread>(`/api/thread/${parentId}`)
        expect(deletedParent.deleted).toBe(true)
        expect(deletedParent.replies.map(item => item.content)).toContain(replyContent)
    }
    finally {
        if (quoteId) await admin.query(`DELETE notification WHERE context = thread:${quoteId};`)
        for (const threadId of createdThreadIds.reverse()) {
            await admin.query(`DELETE thread:${threadId};`)
        }
    }
})

it("enforces local thread locks for replies and quotes", async () => {
    const threadIds: string[] = []

    try {
        const parentResponse = await threadAuthor.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content: `Moderation lock parent ${Date.now()}`, topics: [], images: [] },
        })
        expectStatus(parentResponse, 200, "parent thread stage")
        const parent = parentResponse._data!
        const parentId = extractId(parent.id)
        threadIds.push(parentId)

        const childResponse = await replyAuthor.fetchRaw<Thread>(`/api/thread/${parentId}/reply`, {
            method: "POST",
            body: { content: `Moderation lock child ${Date.now()}` },
        })
        expectStatus(childResponse, 200, "child thread stage")
        const child = childResponse._data!
        const childId = extractId(child.id)
        threadIds.push(childId)

        await admin.query(`CREATE moderation SET subject = thread:${childId}, locked = "item";`)
        const blockedItemReply = await replyAuthor.fetchRaw(`/api/thread/${childId}/reply`, {
            method: "POST",
            body: { content: "This item-locked reply should be blocked." },
        })
        expectStatus(blockedItemReply, 409, "item-locked reply stage")

        const blockedItemQuote = await replyAuthor.fetchRaw(`/api/thread/${childId}/quote`, {
            method: "POST",
            body: { content: "This item-locked quote should be blocked.", topics: [] },
        })
        expectStatus(blockedItemQuote, 409, "item-locked quote stage")
    }
    finally {
        await admin.query([
            `DELETE moderation WHERE subject IN [${threadIds.map(id => `thread:${id}`).join(", ")}];`,
            `DELETE notification WHERE context IN [${threadIds.map(id => `thread:${id}`).join(", ")}];`,
            ...threadIds.reverse().map(id => `DELETE thread:${id};`),
        ].join("\n"))
    }
})

it("enforces per-user item-thread slow mode without inheritance", async () => {
    const threadIds: string[] = []

    try {
        const rootResponse = await threadAuthor.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content: `Slow mode root ${Date.now()}`, topics: [], images: [] },
        })
        expectStatus(rootResponse, 200, "root thread stage")
        const root = rootResponse._data!
        const rootId = extractId(root.id)
        threadIds.push(rootId)
        await admin.query(`CREATE moderation SET subject = thread:${rootId}, slowed = 30;`)

        const firstReplyResponse = await admin.fetchRaw<Thread>(`/api/thread/${rootId}/reply`, {
            method: "POST",
            body: { content: `First admin reply ${Date.now()}` },
        })
        expectStatus(firstReplyResponse, 200, "first reply stage")
        const firstReply = firstReplyResponse._data!
        threadIds.push(extractId(firstReply.id))

        const nestedReplyResponse = await admin.fetchRaw<Thread>(`/api/thread/${extractId(firstReply.id)}/reply`, {
            method: "POST",
            body: { content: `Nested admin reply ${Date.now()}` },
        })
        expectStatus(nestedReplyResponse, 200, "root slow mode does not inherit stage")
        const nestedReply = nestedReplyResponse._data!
        const nestedReplyId = extractId(nestedReply.id)
        threadIds.push(nestedReplyId)

        await admin.query(`CREATE moderation SET subject = thread:${extractId(firstReply.id)}, slowed = 30;`)
        const firstNestedResponse = await replyAuthor.fetchRaw<Thread>(`/api/thread/${extractId(firstReply.id)}/reply`, {
            method: "POST",
            body: { content: `First item-slowed reply ${Date.now()}` },
        })
        expectStatus(firstNestedResponse, 200, "first reply to slowed item stage")
        threadIds.push(extractId(firstNestedResponse._data!.id))

        const blockedItemReply = await replyAuthor.fetchRaw(`/api/thread/${extractId(firstReply.id)}/reply`, {
            method: "POST",
            body: { content: "This item cooldown should block." },
        })
        expectStatus(blockedItemReply, 429, "same-item cooldown stage")

        const otherUserReply = await threadAuthor.fetchRaw<Thread>(`/api/thread/${extractId(firstReply.id)}/reply`, {
            method: "POST",
            body: { content: `Other user reply ${Date.now()}` },
        })
        expectStatus(otherUserReply, 200, "per-user cooldown isolation stage")
        threadIds.push(extractId(otherUserReply._data!.id))

        const concurrentRootResponse = await threadAuthor.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content: `Concurrent slow mode root ${Date.now()}`, topics: [], images: [] },
        })
        expectStatus(concurrentRootResponse, 200, "concurrent root stage")
        const concurrentRootId = extractId(concurrentRootResponse._data!.id)
        threadIds.push(concurrentRootId)
        await admin.query(`CREATE moderation SET subject = thread:${concurrentRootId}, slowed = 30;`)

        const concurrentResponses = await Promise.all([
            admin.fetchRaw(`/api/thread/${concurrentRootId}/reply`, {
                method: "POST",
                body: { content: `Concurrent reply A ${Date.now()}` },
            }),
            admin.fetchRaw(`/api/thread/${concurrentRootId}/reply`, {
                method: "POST",
                body: { content: `Concurrent reply B ${Date.now()}` },
            }),
        ])
        for (const response of concurrentResponses) {
            if (response.status === 200) threadIds.push(extractId(response._data!.id))
        }
        expect(concurrentResponses.every(response => response.status === 200 || response.status === 429)).toBe(true)
        expect(concurrentResponses.some(response => response.status === 200)).toBe(true)

        const blockedAfterConcurrentReplies = await admin.fetchRaw(`/api/thread/${concurrentRootId}/reply`, {
            method: "POST",
            body: { content: "This reply is still within the cooldown." },
        })
        expectStatus(blockedAfterConcurrentReplies, 429, "thread-concurrency cooldown stage")
    }
    finally {
        await admin.query([
            `DELETE notification WHERE context IN [${threadIds.map(id => `thread:${id}`).join(", ")}];`,
            `DELETE moderation WHERE subject IN [${threadIds.map(id => `thread:${id}`).join(", ")}];`,
            ...threadIds.reverse().map(id => `DELETE thread:${id};`),
        ].join("\n"))
    }
})

it("returns all direct replies and complete chains with item moderation", async () => {
    const threadIds: string[] = []

    try {
        const rootResponse = await threadAuthor.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content: `Bounded thread root ${Date.now()}`, topics: [], images: [] },
        })
        expectStatus(rootResponse, 200, "root thread stage")
        const rootId = extractId(rootResponse._data!.id)
        threadIds.push(rootId)

        for (const content of ["First breadth reply", "Second breadth reply"]) {
            const response = await replyAuthor.fetchRaw<Thread>(`/api/thread/${rootId}/reply`, {
                method: "POST",
                body: { content: `${content} ${Date.now()}` },
            })
            expectStatus(response, 200, "breadth reply stage")
            threadIds.push(extractId(response._data!.id))
        }

        const initialReplies = await threadAuthor.fetch<Thread>(`/api/thread/${rootId}`)
        expect(initialReplies.replies).toHaveLength(2)
        const branchId = extractId(initialReplies.replies[0]!.id)
        const otherBranchId = extractId(initialReplies.replies[1]!.id)

        const childResponse = await replyAuthor.fetchRaw<Thread>(`/api/thread/${branchId}/reply`, {
            method: "POST",
            body: { content: `Bounded chain child ${Date.now()}` },
        })
        expectStatus(childResponse, 200, "chain child stage")
        const childId = extractId(childResponse._data!.id)
        threadIds.push(childId)

        const grandchildResponse = await replyAuthor.fetchRaw<Thread>(`/api/thread/${childId}/reply`, {
            method: "POST",
            body: { content: `Bounded chain grandchild ${Date.now()}` },
        })
        expectStatus(grandchildResponse, 200, "chain grandchild stage")
        const grandchildId = extractId(grandchildResponse._data!.id)
        threadIds.push(grandchildId)

        const otherChildResponse = await replyAuthor.fetchRaw<Thread>(`/api/thread/${otherBranchId}/reply`, {
            method: "POST",
            body: { content: `Other branch child ${Date.now()}` },
        })
        expectStatus(otherChildResponse, 200, "other branch child stage")
        threadIds.push(extractId(otherChildResponse._data!.id))

        await admin.query(`
            CREATE moderation SET subject = thread:${branchId}, locked = "item";
            CREATE moderation SET subject = thread:${childId}, slowed = 30;
        `)

        const complete = await threadAuthor.fetch<Thread>(`/api/thread/${rootId}`)
        const lockedBranch = complete.replies.find(reply => extractId(reply.id) === branchId)
        const otherBranch = complete.replies.find(reply => extractId(reply.id) === otherBranchId)
        expect(complete.user).toMatchObject({
            id: threadAuthor.user.id,
            name: threadAuthor.user.name,
            roles: expect.any(Array),
        })
        expect(lockedBranch?.user).toMatchObject({
            id: replyAuthor.user.id,
            name: replyAuthor.user.name,
            roles: expect.any(Array),
        })
        expect(complete.replies).toHaveLength(2)
        expect(lockedBranch?.chain).toHaveLength(2)
        expect(otherBranch?.chain).toHaveLength(1)
        expect(lockedBranch?.moderation).toMatchObject({ locked: "item" })
        expect(lockedBranch?.moderation?.slowed).toBeUndefined()
        expect(lockedBranch?.chain[0]?.moderation).toMatchObject({ slowed: 30 })
        expect(lockedBranch?.chain[1]?.moderation?.slowed).toBeUndefined()
        expect(otherBranch?.chain.some(reply => reply.id === "thread:load_more")).toBe(false)
    }
    finally {
        if (threadIds.length > 0) {
            await admin.query([
                `DELETE notification WHERE context IN [${threadIds.map(id => `thread:${id}`).join(", ")}];`,
                ...threadIds.slice().reverse().map(id => `DELETE thread:${id};`),
            ].join("\n"))
        }
    }
})

it("truncates ancestor and best-reply chains with load-more stubs", async () => {
    const threadIds: string[] = []

    try {
        const rootResponse = await threadAuthor.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content: `Truncated path root ${Date.now()}`, topics: [], images: [] },
        })
        expectStatus(rootResponse, 200, "truncation root stage")
        const rootId = extractId(rootResponse._data!.id)
        threadIds.push(rootId)

        let parentId = rootId
        let targetId = rootId
        let nearestAncestorId = rootId
        for (let index = 0; index < 11; index++) {
            nearestAncestorId = parentId
            const response = await replyAuthor.fetchRaw<Thread>(`/api/thread/${parentId}/reply`, {
                method: "POST",
                body: { content: `Ancestor path ${index} ${Date.now()}` },
            })
            expectStatus(response, 200, `ancestor ${index} stage`)
            targetId = extractId(response._data!.id)
            threadIds.push(targetId)
            parentId = targetId
        }

        const directReplyResponse = await replyAuthor.fetchRaw<Thread>(`/api/thread/${targetId}/reply`, {
            method: "POST",
            body: { content: `Best chain direct reply ${Date.now()}` },
        })
        expectStatus(directReplyResponse, 200, "best chain direct reply stage")
        let chainParentId = extractId(directReplyResponse._data!.id)
        threadIds.push(chainParentId)

        for (let index = 0; index < 11; index++) {
            const response = await replyAuthor.fetchRaw<Thread>(`/api/thread/${chainParentId}/reply`, {
                method: "POST",
                body: { content: `Best chain item ${index} ${Date.now()}` },
            })
            expectStatus(response, 200, `best chain item ${index} stage`)
            chainParentId = extractId(response._data!.id)
            threadIds.push(chainParentId)
        }

        const detailed = await threadAuthor.fetch<Thread>(`/api/thread/${targetId}`)
        expect(detailed.ancestors).toHaveLength(11)
        expect(detailed.ancestors?.[0]?.id).toBe("thread:load_more")
        expect(extractId(detailed.ancestors?.at(-1)?.id)).toBe(nearestAncestorId)
        expect(detailed.replies).toHaveLength(1)
        expect(detailed.replies[0]?.chain).toHaveLength(11)
        expect(detailed.replies[0]?.chain?.at(-1)?.id).toBe("thread:load_more")
    }
    finally {
        if (threadIds.length > 0) {
            await admin.query([
                `DELETE notification WHERE context IN [${threadIds.map(id => `thread:${id}`).join(", ")}];`,
                ...threadIds.slice().reverse().map(id => `DELETE thread:${id};`),
            ].join("\n"))
        }
    }
})
