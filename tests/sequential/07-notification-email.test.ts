import { expect, it } from "vitest"
import type { Account, Thread, UserSettings } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { expectStatus, grabExampleServer, grabUser } from "../test-server"

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
