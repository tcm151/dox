import { expect, it, vi } from "vitest"
import type { Account, Comment, Notification, Post, Thread, UserSettings } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { stubDatabaseQuery } from "../utils/test-database-query"
import { expectStatus, grabExampleServer, grabUser } from "../utils/test-server"

const admin = await grabUser("admin")
const exampleServer = await grabExampleServer("default")
const recipient = exampleServer.users.threadAuthor
const sender = exampleServer.users.commentAuthor

type ScheduledEmail = {
    id: string
    recipient: string
    subject: string
    text: string
    html: string
}

async function saveNotifications(notifications: UserSettings["notifications"]) {
    const settings = await recipient.fetch<UserSettings>("/api/profile/settings")
    const response = await recipient.fetchRaw("/api/profile/settings/update", {
        method: "PUT",
        body: { ...settings, notifications },
    })
    expectStatus(response, 200, "save notification preferences")
    return await recipient.fetch<UserSettings>("/api/profile/settings")
}

async function getQueuedEmails(marker: string) {
    const results = await admin.query<Array<Array<ScheduledEmail>>>(
        `SELECT id, recipient, subject, text, html FROM scheduledEmail WHERE text CONTAINS "${marker}";`,
    )
    return results[0] ?? []
}

async function createNotification(recipientId: string, message: string, viewed: boolean) {
    const results = await admin.query<Array<Array<Notification>>>(`
        RETURN CREATE notification SET
            recipient = ${recipientId},
            context = ${recipientId},
            message = ${JSON.stringify(message)},
            viewed = ${viewed};
    `)
    const notification = results[0]?.[0]
    if (!notification) throw new Error(`Failed to create notification: ${message}`)
    return notification
}

it("queues notification email only when enabled, independently of in-app notifications", async () => {
    const originalSettings = await recipient.fetch<UserSettings>("/api/profile/settings")
    expect(originalSettings.notifications.email).toBe(false)

    const suffix = Date.now()
    const emailEnabledMarker = `email_enabled_${suffix}`
    const emailDisabledMarker = `email_disabled_${suffix}`
    let parentId: string | undefined
    const replyIds: string[] = []

    try {
        const parentResponse = await recipient.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content: `notification email test ${suffix}`, topics: [], images: [] },
        })
        expectStatus(parentResponse, 200, "create notification test thread")
        const parent = parentResponse._data!
        parentId = extractId(parent.id)

        const emailEnabledSettings = await saveNotifications({ inApp: false, email: true })
        expect(emailEnabledSettings.notifications).toEqual({ inApp: false, email: true })

        const emailEnabledReply = await sender.fetchRaw<Thread>(`/api/thread/${parentId}/reply`, {
            method: "POST",
            body: { content: emailEnabledMarker },
        })
        expectStatus(emailEnabledReply, 200, "reply while email notifications are enabled")
        const firstReply = emailEnabledReply._data!
        replyIds.push(firstReply.id)

        const firstEmails = await getQueuedEmails(emailEnabledMarker)
        expect(firstEmails).toHaveLength(1)
        const account = await recipient.fetch<Account>("/api/profile/account")
        expect(firstEmails[0].recipient).toBe(account.email)
        expect(firstEmails[0].text).toContain(emailEnabledMarker)
        expect(firstEmails[0].html).toContain(emailEnabledMarker)

        const firstNotifications = await recipient.fetch<{ notifications: Array<{ context: string }> }>(
            "/api/profile/notifications?dismissed=false&amount=100",
        )
        expect(firstNotifications.notifications.some(item => item.context === firstReply.id)).toBe(false)

        const emailDisabledSettings = await saveNotifications({ inApp: true, email: false })
        expect(emailDisabledSettings.notifications).toEqual({ inApp: true, email: false })

        const emailDisabledReply = await sender.fetchRaw<Thread>(`/api/thread/${parentId}/reply`, {
            method: "POST",
            body: { content: emailDisabledMarker },
        })
        expectStatus(emailDisabledReply, 200, "reply while email notifications are disabled")
        const secondReply = emailDisabledReply._data!
        replyIds.push(secondReply.id)

        expect(await getQueuedEmails(emailDisabledMarker)).toHaveLength(0)
        const secondNotifications = await recipient.fetch<{ notifications: Array<{ context: string }> }>(
            "/api/profile/notifications?dismissed=false&amount=100",
        )
        expect(secondNotifications.notifications.some(item => item.context === secondReply.id)).toBe(true)
    }
    finally {
        const restoreResponse = await recipient.fetchRaw("/api/profile/settings/update", {
            method: "PUT",
            body: originalSettings,
        })
        expectStatus(restoreResponse, 200, "restore notification preferences")

        await admin.query(
            `DELETE scheduledEmail WHERE text CONTAINS "${emailEnabledMarker}" OR text CONTAINS "${emailDisabledMarker}";`,
        )
        for (const replyId of replyIds) {
            await admin.query(`DELETE notification WHERE context = ${replyId};`)
            await admin.query(`DELETE ${replyId};`)
        }
        if (parentId) await admin.query(`DELETE thread:${parentId};`)
    }
})

it("validates notification filters and scopes individual and bulk dismissal", async () => {
    const suffix = Date.now()
    const messages = {
        oldestUnread: `notification_oldest_${suffix}`,
        viewed: `notification_viewed_${suffix}`,
        newestUnread: `notification_newest_${suffix}`,
    }
    const notificationIds: string[] = []
    const originalUnread = await admin.query<Array<Array<{ id: string }>>>(
        `SELECT id FROM notification WHERE recipient = ${recipient.user.id} AND viewed = false;`,
    )
    const originalUnreadIds = originalUnread[0]?.map(notification => notification.id) ?? []

    try {
        for (const path of [
            "/api/profile/notifications?amount=10",
            "/api/profile/notifications?dismissed=invalid&amount=10",
            "/api/profile/notifications?dismissed=false",
            "/api/profile/notifications?dismissed=false&amount=-1",
            "/api/profile/notifications?dismissed=false&amount=1.5",
        ]) {
            expectStatus(await recipient.fetchRaw(path), 400, `invalid notification query ${path}`)
        }

        const unreadBefore = await recipient.fetch<{ total: number }>("/api/profile/notifications?dismissed=false&amount=0")
        const allBefore = await recipient.fetch<{ total: number }>("/api/profile/notifications?dismissed=true&amount=0")
        const oldestUnread = await createNotification(recipient.user.id, messages.oldestUnread, false)
        const viewed = await createNotification(recipient.user.id, messages.viewed, true)
        const newestUnread = await createNotification(recipient.user.id, messages.newestUnread, false)
        notificationIds.push(oldestUnread.id, viewed.id, newestUnread.id)

        await admin.query(`
            UPDATE ${oldestUnread.id} SET time = time::now() + 1h;
            UPDATE ${viewed.id} SET time = time::now() + 2h;
            UPDATE ${newestUnread.id} SET time = time::now() + 3h;
        `)

        const unreadWithoutRows = await recipient.fetch<{ total: number, notifications: Notification[] }>(
            "/api/profile/notifications?dismissed=false&amount=0",
        )
        expect(unreadWithoutRows.notifications).toEqual([])
        expect(unreadWithoutRows.total).toBe(unreadBefore.total + 2)

        const limited = await recipient.fetch<{ total: number, notifications: Notification[] }>(
            "/api/profile/notifications?dismissed=false&amount=1",
        )
        expect(limited.total).toBe(unreadBefore.total + 2)
        expect(limited.notifications).toHaveLength(1)
        expect(limited.notifications[0]?.message).toBe(messages.newestUnread)

        const unread = await recipient.fetch<{ total: number, notifications: Notification[] }>(
            "/api/profile/notifications?dismissed=false&amount=1000",
        )
        expect(unread.total).toBe(unreadBefore.total + 2)
        expect(unread.notifications.filter(item => Object.values(messages).includes(item.message)).map(item => item.message))
            .toEqual([messages.newestUnread, messages.oldestUnread])

        const all = await recipient.fetch<{ total: number, notifications: Notification[] }>(
            "/api/profile/notifications?dismissed=true&amount=1000",
        )
        expect(all.total).toBe(allBefore.total + 3)
        expect(all.notifications.filter(item => Object.values(messages).includes(item.message)).map(item => item.message))
            .toEqual([messages.newestUnread, messages.viewed, messages.oldestUnread])

        const ownerDismiss = await recipient.fetchRaw<boolean>(
            `/api/profile/notifications/${extractId(oldestUnread.id)}/dismiss`,
            { method: "POST" },
        )
        expectStatus(ownerDismiss, 200, "owner single-dismiss stage")
        expect(ownerDismiss._data).toBe(true)

        const repeatedDismiss = await recipient.fetchRaw<boolean>(
            `/api/profile/notifications/${extractId(oldestUnread.id)}/dismiss`,
            { method: "POST" },
        )
        expectStatus(repeatedDismiss, 200, "repeated single-dismiss stage")
        expect(repeatedDismiss._data).toBe(true)

        const otherOwnerNotification = await createNotification(sender.user.id, `notification_other_${suffix}`, false)
        notificationIds.push(otherOwnerNotification.id)
        const deniedDismiss = await recipient.fetchRaw(
            `/api/profile/notifications/${extractId(otherOwnerNotification.id)}/dismiss`,
            { method: "POST" },
        )
        expectStatus(deniedDismiss, 404, "non-owner single-dismiss stage")

        const missingDismiss = await recipient.fetchRaw(
            `/api/profile/notifications/missing${suffix}/dismiss`,
            { method: "POST" },
        )
        expectStatus(missingDismiss, 404, "missing notification single-dismiss stage")

        const ownState = await admin.query<Array<Array<{ viewed: boolean }>>>(`SELECT viewed FROM ${oldestUnread.id};`)
        const otherState = await admin.query<Array<Array<{ viewed: boolean }>>>(`SELECT viewed FROM ${otherOwnerNotification.id};`)
        expect(ownState[0]?.[0]?.viewed).toBe(true)
        expect(otherState[0]?.[0]?.viewed).toBe(false)

        const bulkOwned = await createNotification(recipient.user.id, `notification_bulk_owned_${suffix}`, false)
        const bulkOther = await createNotification(sender.user.id, `notification_bulk_other_${suffix}`, false)
        notificationIds.push(bulkOwned.id, bulkOther.id)
        const bulkDismiss = await recipient.fetchRaw<boolean>("/api/profile/notifications/dismiss", { method: "POST" })
        expectStatus(bulkDismiss, 200, "bulk-dismiss stage")
        expect(bulkDismiss._data).toBe(true)

        const bulkOwnedState = await admin.query<Array<Array<{ viewed: boolean }>>>(`SELECT viewed FROM ${bulkOwned.id};`)
        const bulkOtherState = await admin.query<Array<Array<{ viewed: boolean }>>>(`SELECT viewed FROM ${bulkOther.id};`)
        expect(bulkOwnedState[0]?.[0]?.viewed).toBe(true)
        expect(bulkOtherState[0]?.[0]?.viewed).toBe(false)
    }
    finally {
        for (const id of notificationIds) await admin.query(`DELETE ${id};`)
        for (const id of originalUnreadIds) await admin.query(`UPDATE ${id} SET viewed = false;`)
    }
})

it("uses the replied-to comment as context and honors in-app preferences", async () => {
    const originalSettings = await recipient.fetch<UserSettings>("/api/profile/settings")
    const suffix = Date.now()
    const firstMarker = `comment_reply_email_${suffix}`
    const secondMarker = `comment_reply_in_app_${suffix}`
    let postId: string | undefined
    let targetThreadId: string | undefined
    const commentRecords: string[] = []
    const quoteRecords: string[] = []
    const quoteEmailMarker = `thread_quote_email_${suffix}`
    const quoteInAppMarker = `thread_quote_in_app_${suffix}`

    try {
        const postResponse = await sender.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: {
                title: `Notification comment target ${suffix}`,
                content: "Comment notification preference test.",
                topics: [],
                images: [],
            },
        })
        expectStatus(postResponse, 200, "comment notification post stage")
        const post = postResponse._data!
        postId = extractId(post.id)

        const rootResponse = await recipient.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: { context: post.id, replyTo: post.id, content: `Comment notification root ${suffix}` },
        })
        expectStatus(rootResponse, 200, "comment notification root stage")
        const root = rootResponse._data!
        commentRecords.push(root.id)

        const targetThreadResponse = await recipient.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content: `Notification quote target ${suffix}`, topics: [], images: [] },
        })
        expectStatus(targetThreadResponse, 200, "notification quote target stage")
        targetThreadId = extractId(targetThreadResponse._data!.id)

        const emailOnlySettings = await saveNotifications({ inApp: false, email: true })
        expect(emailOnlySettings.notifications).toEqual({ inApp: false, email: true })
        const emailOnlyResponse = await sender.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: { context: post.id, replyTo: root.id, content: firstMarker },
        })
        expectStatus(emailOnlyResponse, 200, "comment reply with email-only preference stage")
        const emailOnlyReply = emailOnlyResponse._data!
        commentRecords.push(emailOnlyReply.id)

        const emailOnlyQuoteResponse = await sender.fetchRaw<Thread>(`/api/thread/${targetThreadId}/quote`, {
            method: "POST",
            body: { content: quoteEmailMarker, topics: [] },
        })
        expectStatus(emailOnlyQuoteResponse, 200, "thread quote with email-only preference stage")
        const emailOnlyQuote = emailOnlyQuoteResponse._data!
        quoteRecords.push(emailOnlyQuote.id)

        expect(await getQueuedEmails(firstMarker)).toHaveLength(1)
        expect(await getQueuedEmails(quoteEmailMarker)).toHaveLength(1)
        const emailOnlyNotifications = await recipient.fetch<{ notifications: Notification[] }>(
            "/api/profile/notifications?dismissed=true&amount=1000",
        )
        expect(emailOnlyNotifications.notifications.some(item => item.context === emailOnlyReply.id)).toBe(false)
        expect(emailOnlyNotifications.notifications.some(item => item.context === emailOnlyQuote.id)).toBe(false)

        const inAppOnlySettings = await saveNotifications({ inApp: true, email: false })
        expect(inAppOnlySettings.notifications).toEqual({ inApp: true, email: false })
        const inAppOnlyResponse = await sender.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: { context: post.id, replyTo: root.id, content: secondMarker },
        })
        expectStatus(inAppOnlyResponse, 200, "comment reply with in-app-only preference stage")
        const inAppOnlyReply = inAppOnlyResponse._data!
        commentRecords.push(inAppOnlyReply.id)

        const inAppOnlyQuoteResponse = await sender.fetchRaw<Thread>(`/api/thread/${targetThreadId}/quote`, {
            method: "POST",
            body: { content: quoteInAppMarker, topics: [] },
        })
        expectStatus(inAppOnlyQuoteResponse, 200, "thread quote with in-app-only preference stage")
        const inAppOnlyQuote = inAppOnlyQuoteResponse._data!
        quoteRecords.push(inAppOnlyQuote.id)

        expect(await getQueuedEmails(secondMarker)).toHaveLength(0)
        expect(await getQueuedEmails(quoteInAppMarker)).toHaveLength(0)
        const inAppNotifications = await recipient.fetch<{ notifications: Notification[] }>(
            "/api/profile/notifications?dismissed=false&amount=1000",
        )
        const notification = inAppNotifications.notifications.find(item => item.context === inAppOnlyReply.id)
        expect(notification?.message).toContain(secondMarker)
        const quoteNotification = inAppNotifications.notifications.find(item => item.context === inAppOnlyQuote.id)
        expect(quoteNotification?.message).toContain(quoteInAppMarker)

        const redirect = await recipient.fetchRaw(`/comment/${extractId(inAppOnlyReply.id)}`, { redirect: "manual" })
        expectStatus(redirect, 302, "comment notification destination stage")
        expect(redirect.headers.get("location")).toBe(`/post/${postId}#${encodeURIComponent(inAppOnlyReply.id)}`)
    }
    finally {
        const restoreResponse = await recipient.fetchRaw("/api/profile/settings/update", {
            method: "PUT",
            body: originalSettings,
        })
        expectStatus(restoreResponse, 200, "restore notification preferences")
        await admin.query(`
            DELETE scheduledEmail
            WHERE text CONTAINS "${firstMarker}"
                OR text CONTAINS "${secondMarker}"
                OR text CONTAINS "${quoteEmailMarker}"
                OR text CONTAINS "${quoteInAppMarker}";
        `)
        for (const comment of commentRecords.reverse()) {
            await admin.query(`DELETE notification WHERE context = ${comment}; DELETE ${comment};`)
        }
        for (const quote of quoteRecords.reverse()) {
            await admin.query(`DELETE notification WHERE context = ${quote}; DELETE ${quote};`)
        }
        if (postId) {
            await admin.query(`DELETE notification WHERE context = post:${postId}; DELETE post:${postId};`)
        }
        if (targetThreadId) await admin.query(`DELETE thread:${targetThreadId};`)
    }
})

it("logs notification persistence failures without rejecting callers", async () => {
    const error = new Error("Notification database unavailable")
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    vi.stubGlobal("useStorage", () => ({
        getItem: async () => "<html>{{notification.message}}</html>",
    }))
    const calls = stubDatabaseQuery({
        execute: async () => {
            throw error
        },
    })

    try {
        const { NotificationManager } = await import("../../server/utils/repos/NotificationManager")
        await expect(NotificationManager.send({
            recipient: recipient.user.id,
            context: "post:notification_failure_test",
            message: "Notification failure test",
        })).resolves.toBeUndefined()

        expect(calls).toHaveLength(1)
        expect(consoleError).toHaveBeenCalledWith("Failed to create or queue notification.", {
            recipient: recipient.user.id,
            context: "post:notification_failure_test",
            error,
        })
    }
    finally {
        vi.unstubAllGlobals()
        consoleError.mockRestore()
    }
})
