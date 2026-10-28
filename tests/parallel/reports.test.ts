import { expect, it } from "vitest"
import { expectStatus, fetch, grabExampleServer, grabUser } from "../test-server"
import { extractId } from "../../shared/utils/records"
import type { ModeratorLog, Thread } from "../../shared/types"

const admin = await grabUser("admin")
const exampleServer = await grabExampleServer("default")
const threadAuthor = exampleServer.users.threadAuthor
const reporter = exampleServer.users.commentAuthor

async function getModeratorLogs(target: string) {
    const results = await admin.query<ModeratorLog[][]>(`SELECT * FROM moderatorLog WHERE target = ${target} ORDER BY time ASC;`)
    return results[0] ?? []
}

it("rejects report submissions without authentication", async () => {
    const response = await fetch("/api/report/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: "thread:missing" }),
    })
    expectStatus(response, 401)
})

it("lists a report in administrator and topic queues", async () => {
    const content = `Report test subject ${Date.now()}`
    const topicId = `reportQueue${Date.now()}`
    let threadId: string | undefined
    let reportId: string | undefined

    try {
        const threadResponse = await threadAuthor.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content, topics: [`topic:${topicId}`], images: [] },
        })
        expectStatus(threadResponse, 200, "report subject creation stage")
        const thread = threadResponse._data!
        threadId = extractId(thread.id)
        expect(threadId).toBeDefined()

        const reportResponse = await reporter.fetchRaw("/api/report/send", {
            method: "POST",
            body: { subject: thread.id, reason: "This thread violates the community rules." },
        })
        expectStatus(reportResponse, 204, "report submission stage")
        const firstReports = await admin.fetch<Array<{
            id: string
            subject: { id: string }
            author: { id: string, name: string }
            complaints: Array<{ reporter: { id: string }, reason: string }>
        }>>("/api/report")
        const firstReport = firstReports.find(item => item.subject.id === thread.id)
        expect(firstReport, "first report appears in the admin queue").toBeDefined()
        reportId = extractId(firstReport!.id)
        expect(reportId).toBeDefined()
        expect(firstReport!.author).toEqual({ id: threadAuthor.user.id, name: threadAuthor.user.name })
        expect(firstReport!.complaints).toHaveLength(1)
        expect(firstReport!.complaints[0]!.reporter.id).toBe(reporter.user.id)
        expect(await getModeratorLogs(`report:${reportId}`)).toEqual([])

        const topicReports = await admin.fetch<Array<{ subject: { id: string }, author: { id: string, name: string } }>>(`/api/topic/${topicId}/reports`)
        expect(topicReports.some(item => item.subject.id === thread.id && item.author.id === threadAuthor.user.id && item.author.name === threadAuthor.user.name)).toBe(true)

        const secondReportResponse = await reporter.fetchRaw("/api/report/send", {
            method: "POST",
            body: { subject: thread.id, reason: "A second report for this same thread." },
        })
        expectStatus(secondReportResponse, 204, "second report submission stage")

        const reports = await admin.fetch<Array<{
            id: string
            subject: { id: string }
            complaints: Array<{ reporter: { id: string }, reason: string }>
        }>>("/api/report")
        const listedReports = reports.filter(item => item.subject.id === thread.id)
        expect(listedReports).toHaveLength(1)
        expect(extractId(listedReports[0]!.id)).toBe(reportId)
        expect(listedReports[0]!.complaints).toHaveLength(2)
        expect(listedReports[0]!.complaints.every(item => item.reporter.id === reporter.user.id)).toBe(true)

        const shortResolutionResponse = await admin.fetchRaw(`/api/report/${reportId}/resolve`, {
            method: "POST",
            body: { resolution: "No" },
        })
        expectStatus(shortResolutionResponse, 400, "short report resolution stage")

        const resolutionResponse = await admin.fetchRaw<Array<{
            resolution?: string
            status: string
            moderator?: string
        }>>(`/api/report/${reportId}/resolve`, {
            method: "POST",
            body: { resolution: "Reviewed and resolved." },
        })
        expectStatus(resolutionResponse, 200, "report resolution stage")
        const approvedReports = resolutionResponse._data!
        expect(approvedReports).toHaveLength(1)
        expect(approvedReports[0]!.resolution).toBe("Reviewed and resolved.")
        expect(approvedReports[0]!.status).toBe("approved")
        expect(approvedReports[0]!.moderator).toBe(admin.user.id)
        expect(approvedReports[0]).not.toHaveProperty("moderatorEvent")
        const firstModeratorLog = await getModeratorLogs(`report:${reportId}`)
        expect(firstModeratorLog).toHaveLength(1)
        expect(firstModeratorLog[0]).toMatchObject({
            actor: admin.user.id,
            action: "report.approved",
            target: `report:${reportId}`,
            details: {
                before: { status: "pending" },
                after: { status: "approved", resolution: "Reviewed and resolved." },
            },
        })

        const resolutionEditResponse = await admin.fetchRaw(`/api/report/${reportId}/resolve`, {
            method: "POST",
            body: { resolution: "Updated decision note." },
        })
        expectStatus(resolutionEditResponse, 200, "report resolution edit stage")
        const resolutionEditLogs = await getModeratorLogs(`report:${reportId}`)
        expect(resolutionEditLogs).toHaveLength(2)
        expect(resolutionEditLogs[1]).toMatchObject({
            actor: admin.user.id,
            action: "report.resolution_updated",
            target: `report:${reportId}`,
        })

        const laterReportResponse = await reporter.fetchRaw("/api/report/send", {
            method: "POST",
            body: { subject: thread.id, reason: "Additional context after resolution." },
        })
        expectStatus(laterReportResponse, 204, "later complaint does not reopen report stage")
        const afterLaterReports = await admin.fetch<Array<{
            id: string
            subject: { id: string }
            status: string
            resolution?: string
            moderator?: { id: string }
            complaints: Array<{ reason: string }>
        }>>("/api/report")
        const afterLaterReport = afterLaterReports.find(item => item.subject.id === thread.id)
        expect(afterLaterReport).toMatchObject({
            id: `report:${reportId}`,
            status: "approved",
            resolution: "Updated decision note.",
            moderator: { id: admin.user.id },
        })
        expect(afterLaterReport!.complaints).toHaveLength(3)
        expect(await getModeratorLogs(`report:${reportId}`)).toHaveLength(2)

        const clearResolutionResponse = await admin.fetchRaw<Array<{ resolution?: string }>>(`/api/report/${reportId}/reopen`, {
            method: "POST",
        })
        expectStatus(clearResolutionResponse, 200, "report resolution clear stage")
        const clearedReports = clearResolutionResponse._data!
        expect(clearedReports).toHaveLength(1)
        expect(clearedReports[0]!.resolution).toBeUndefined()
        const reopenedLogs = await getModeratorLogs(`report:${reportId}`)
        expect(reopenedLogs).toHaveLength(3)
        expect(reopenedLogs[2]).toMatchObject({ action: "report.reopened" })

        const missingRemovalNote = await admin.fetchRaw(`/api/report/${reportId}/remove`, {
            method: "POST",
        })
        expectStatus(missingRemovalNote, 400, "missing report removal note stage")

        const shortRemovalNote = await admin.fetchRaw(`/api/report/${reportId}/remove`, {
            method: "POST",
            body: { resolution: "No" },
        })
        expectStatus(shortRemovalNote, 400, "short report removal note stage")

        const removedResponse = await admin.fetchRaw<Array<{ status: string, resolution: string }>>(`/api/report/${reportId}/remove`, {
            method: "POST",
            body: { resolution: "The content violates community rules." },
        })
        expectStatus(removedResponse, 200, "report removal status stage")
        const removedReports = removedResponse._data!
        expect(removedReports).toHaveLength(1)
        expect(removedReports[0]!.status).toBe("removed")
        expect(removedReports[0]!.resolution).toBe("The content violates community rules.")
        const quarantinedThread = await admin.fetch<{ status: string }>(`/api/thread/${threadId}`)
        expect(quarantinedThread.status).toBe("quarantined")
        const authorNotifications = await threadAuthor.fetch<{ notifications: Array<{ context: string, message: string }> }>("/api/profile/notifications?dismissed=false&amount=100")
        expect(authorNotifications.notifications.some(notification => notification.context === `report:${reportId}` && /quarantin|removed/i.test(notification.message))).toBe(true)
        const reporterNotifications = await reporter.fetch<{ notifications: Array<{ context: string, message: string }> }>("/api/profile/notifications?dismissed=false&amount=100")
        expect(reporterNotifications.notifications.some(notification => notification.context === thread.id && /quarantin|removed/i.test(notification.message))).toBe(true)
        const removedLogs = await getModeratorLogs(`report:${reportId}`)
        expect(removedLogs).toHaveLength(4)
        expect(removedLogs[3]).toMatchObject({ action: "report.removed" })

        const restoreResponse = await admin.fetchRaw(`/api/report/${reportId}/resolve`, {
            method: "POST",
            body: { resolution: "Appeal accepted." },
        })
        expectStatus(restoreResponse, 200, "reopen quarantined report stage")
        const restoredThread = await admin.fetch<{ status: string }>(`/api/thread/${threadId}`)
        expect(restoredThread.status).toBe("active")
        const authorNotificationsAfterRestore = await threadAuthor.fetch<{ notifications: Array<{ context: string, message: string }> }>("/api/profile/notifications?dismissed=false&amount=100")
        expect(authorNotificationsAfterRestore.notifications.some(notification => notification.context === thread.id && /restor|reopen/i.test(notification.message))).toBe(true)
        const restoredLogs = await getModeratorLogs(`report:${reportId}`)
        expect(restoredLogs).toHaveLength(5)
        expect(restoredLogs[4]).toMatchObject({ action: "report.approved" })

        const reopenAgainResponse = await admin.fetchRaw(`/api/report/${reportId}/reopen`, {
            method: "POST",
        })
        expectStatus(reopenAgainResponse, 200, "approved report can be reopened stage")
        const reopenedAgainLogs = await getModeratorLogs(`report:${reportId}`)
        expect(reopenedAgainLogs).toHaveLength(6)
        expect(reopenedAgainLogs[5]).toMatchObject({ action: "report.reopened" })

        const topicUpdateResponse = await admin.fetchRaw(`/api/topic/${topicId}/reports/${reportId}/resolve`, {
            method: "POST",
            body: { resolution: "Topic report reviewed." },
        })
        expectStatus(topicUpdateResponse, 200, "topic report update stage")
        const topicUpdateLogs = await getModeratorLogs(`report:${reportId}`)
        expect(topicUpdateLogs).toHaveLength(7)
        expect(topicUpdateLogs[6]).toMatchObject({ action: "report.approved" })

        const reopenedResponse = await reporter.fetchRaw("/api/report/send", {
            method: "POST",
            body: { subject: thread.id, reason: "New evidence after the decision." },
        })
        expectStatus(reopenedResponse, 204, "new complaint does not reopen stage")
        // TODO this looks a little weird, maybe use an established interface instead
        const reopenedReports = await admin.fetch<Array<{
            id: string
            subject: { id: string }
            status: string
            resolution?: string
            moderator?: { id: string }
            complaints: Array<{ reason: string }>
        }>>("/api/report")
        const reportAfterComplaint = reopenedReports.find(item => item.subject.id === thread.id)
        if (!reportAfterComplaint) throw new Error("Report should remain in the admin queue.")
        expect(extractId(reportAfterComplaint.id)).toBe(reportId)
        expect(reportAfterComplaint.status).toBe("approved")
        expect(reportAfterComplaint.resolution).toBe("Topic report reviewed.")
        expect(reportAfterComplaint.moderator?.id).toBe(admin.user.id)
        expect(reportAfterComplaint.complaints).toHaveLength(4)
        expect(await getModeratorLogs(`report:${reportId}`)).toHaveLength(7)
    }
    finally {
        await admin.query([
            ...(reportId ? [`DELETE moderatorLog WHERE target = report:${reportId};`] : []),
            ...(reportId ? [`DELETE report:${reportId};`] : []),
            ...(threadId ? [`DELETE thread:${threadId};`] : []),
            `DELETE topic:${topicId};`,
        ].join("\n"))
    }
})

it("keeps moderator-owned reports and original-moderator appeals out of their queue", async () => {
        const content = `Owned report test ${Date.now()}`
        const topicId = `ownedReport${Date.now()}`
        const originalRoles = JSON.stringify(reporter.user.roles)
        const reportIds: string[] = []
        const threadIds: string[] = []

        try {
            await admin.query(`UPDATE ${reporter.user.id} SET roles = ["moderator"];`)

            const adminThreadResponse = await admin.fetchRaw<Thread>("/api/thread/add", {
                method: "POST",
                body: { content: `${content} admin`, topics: [`topic:${topicId}`], images: [] },
            })
            expectStatus(adminThreadResponse, 200, "admin-owned subject creation stage")
            const adminThread = adminThreadResponse._data!
            threadIds.push(extractId(adminThread.id)!)

            await admin.query(`UPDATE topic:${topicId} SET moderators += ${reporter.user.id};`)

            const moderatorThreadResponse = await reporter.fetchRaw<Thread>("/api/thread/add", {
                method: "POST",
                body: { content: `${content} moderator`, topics: [`topic:${topicId}`], images: [] },
            })
            expectStatus(moderatorThreadResponse, 200, "moderator-owned subject creation stage")
            const moderatorThread = moderatorThreadResponse._data!
            threadIds.push(extractId(moderatorThread.id)!)

            const adminThreadReport = await reporter.fetchRaw("/api/report/send", {
                method: "POST",
                body: { subject: adminThread.id, reason: "This content needs moderator review." },
                headers: { "X-Forwarded-For": "192.0.2.61" },
            })
            expectStatus(adminThreadReport, 204, "admin-owned subject report stage")
            const moderatorThreadReport = await threadAuthor.fetchRaw("/api/report/send", {
                method: "POST",
                body: { subject: moderatorThread.id, reason: "This content needs moderator review." },
                headers: { "X-Forwarded-For": "192.0.2.62" },
            })
            expectStatus(moderatorThreadReport, 204, "moderator-owned subject report stage")

            const adminQueue = await admin.fetch<Array<{ id: string, subject: { id: string }, author: { id: string, name: string } }>>("/api/report")
            const adminReport = adminQueue.find(report => report.subject.id === adminThread.id)
            const moderatorReport = adminQueue.find(report => report.subject.id === moderatorThread.id)
            expect(adminReport?.author.id).toBe(admin.user.id)
            expect(moderatorReport?.author.id).toBe(reporter.user.id)
            const adminReportId = extractId(adminReport?.id)
            const moderatorReportId = extractId(moderatorReport?.id)
            expect(adminReportId).toBeDefined()
            expect(moderatorReportId).toBeDefined()
            reportIds.push(adminReportId!, moderatorReportId!)

            const moderatorQueue = await reporter.fetch<Array<{ subject: { id: string } }>>(`/api/topic/${topicId}/reports`)
            expect(moderatorQueue.some(report => report.subject.id === adminThread.id)).toBe(true)
            expect(moderatorQueue.some(report => report.subject.id === moderatorThread.id)).toBe(false)

            for (const [action, body] of [
                ["resolve", { resolution: "I own this content." }],
                ["remove", { resolution: "I own this content." }],
                ["reopen", undefined],
            ] as const) {
                const response = await admin.fetchRaw(`/api/report/${adminReportId}/${action}`, { method: "POST", body })
                expectStatus(response, 403, `admin cannot ${action} own content`)
            }

            const moderatorOwnReport = await reporter.fetchRaw(`/api/topic/${topicId}/reports/${moderatorReportId}/resolve`, {
                method: "POST",
                body: { resolution: "I own this content." },
            })
            expectStatus(moderatorOwnReport, 403, "moderator cannot approve own content")

            const removal = await reporter.fetchRaw(`/api/topic/${topicId}/reports/${adminReportId}/remove`, {
                method: "POST",
                body: { resolution: "The content violates community rules." },
            })
            expectStatus(removal, 200, "moderator removes admin-owned content stage")
            const appeal = await admin.fetchRaw(`/api/report/${adminReportId}/appeal`, {
                method: "POST",
                body: { reason: "Please review the moderation decision." },
            })
            expectStatus(appeal, 200, "admin submits appeal for owned content stage")

            for (const decision of ["accept", "reject"] as const) {
                const response = await admin.fetchRaw(`/api/report/${adminReportId}/appeal/${decision}`, {
                    method: "POST",
                    body: { resolution: "I own this content." },
                })
                expectStatus(response, 403, `admin cannot ${decision} own appeal`)
            }

            const recusedQueue = await reporter.fetch<Array<{ subject: { id: string } }>>(`/api/topic/${topicId}/reports`)
            expect(recusedQueue.some(report => report.subject.id === adminThread.id)).toBe(false)
            const finalAdminQueue = await admin.fetch<Array<{ subject: { id: string } }>>("/api/report")
            expect(finalAdminQueue.some(report => report.subject.id === adminThread.id)).toBe(true)
        }
        finally {
            await admin.query([
                `UPDATE ${reporter.user.id} SET roles = ${originalRoles};`,
                ...reportIds.map(reportId => `DELETE moderatorLog WHERE target = report:${reportId};`),
                ...reportIds.map(reportId => `DELETE report:${reportId};`),
                ...threadIds.map(threadId => `DELETE thread:${threadId};`),
                `DELETE topic:${topicId};`,
            ].join("\n"))
        }
})

it("allows content owners to appeal removal for distinct-moderator review", async () => {
    const content = `Appeal test subject ${Date.now()}`
    const topicId = `appeal${Date.now()}`
    const originalRoles = JSON.stringify(reporter.user.roles)
    const reportIds: string[] = []
    const threadIds: string[] = []

    try {
        await admin.query(`UPDATE ${reporter.user.id} SET roles = ["moderator"];`)

        const firstThreadResponse = await threadAuthor.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content: `${content} one`, topics: [`topic:${topicId}`], images: [] },
        })
        expectStatus(firstThreadResponse, 200, "first appeal subject creation stage")
        const firstThread = firstThreadResponse._data!
        threadIds.push(extractId(firstThread.id)!)

        const secondThreadResponse = await threadAuthor.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content: `${content} two`, topics: [`topic:${topicId}`], images: [] },
        })
        expectStatus(secondThreadResponse, 200, "second appeal subject creation stage")
        const secondThread = secondThreadResponse._data!
        threadIds.push(extractId(secondThread.id)!)

        await admin.query(`UPDATE topic:${topicId} SET moderators += ${reporter.user.id};`)

        for (const thread of [firstThread, secondThread]) {
            const reportResponse = await admin.fetchRaw("/api/report/send", {
                method: "POST",
                body: { subject: thread.id, reason: "The content needs moderator review." },
                headers: { "X-Forwarded-For": "203.0.113.47" },
            })
            expectStatus(reportResponse, 204, "appeal report submission stage")
        }

        const reports = await admin.fetch<Array<{ id: string, subject: { id: string } }>>("/api/report")
        const firstReportId = extractId(reports.find(report => report.subject.id === firstThread.id)?.id)
        const secondReportId = extractId(reports.find(report => report.subject.id === secondThread.id)?.id)
        expect(firstReportId).toBeDefined()
        expect(secondReportId).toBeDefined()
        reportIds.push(firstReportId!, secondReportId!)

        const firstRemoval = await admin.fetchRaw(`/api/report/${firstReportId}/remove`, {
            method: "POST",
            body: { resolution: "The content violated community rules." },
        })
        expectStatus(firstRemoval, 200, "first report removal stage")

        const ownerNotifications = await threadAuthor.fetch<{ notifications: Array<{ context: string, message: string }> }>("/api/profile/notifications?dismissed=false&amount=100")
        const removalNotification = ownerNotifications.notifications.find(notification => notification.context === `report:${firstReportId}` && /quarantin/i.test(notification.message))
        expect(removalNotification).toBeDefined()
        expect(removalNotification?.message).not.toContain("[Open appeal]")

        const ownerAppealStatus = await threadAuthor.fetchRaw<{
            status: string
            appeal?: { reason: string, time: string, moderator?: string }
        }>(`/api/profile/appeals/${firstReportId}`)
        expectStatus(ownerAppealStatus, 200, "owner appeal status stage")
        expect(ownerAppealStatus._data).toMatchObject({ status: "removed" })

        const nonOwnerAppealStatus = await reporter.fetchRaw(`/api/profile/appeals/${firstReportId}`)
        expectStatus(nonOwnerAppealStatus, 204, "non-owner appeal status stage")
        expect(nonOwnerAppealStatus._data).toBeUndefined()

        const firstAppealResponse = await threadAuthor.fetchRaw<Array<{ appeal: { reason: string, time: string, moderator?: string } }>>(
            `/api/report/${firstReportId}/appeal`,
            { method: "POST", body: { reason: "Please reconsider this removal." } },
        )
        expectStatus(firstAppealResponse, 200, "owner appeal submission stage")
        expect(firstAppealResponse._data![0]!.status).toBe("appealed")
        expect(firstAppealResponse._data![0]!.appeal).toMatchObject({
            reason: "Please reconsider this removal.",
            time: expect.any(String),
        })
        expect(firstAppealResponse._data![0]!.appeal).not.toHaveProperty("status")
        expect(firstAppealResponse._data![0]!.appeal).not.toHaveProperty("moderator")
        const submittedAppealStatus = await threadAuthor.fetch<{ appeal: { reason: string, time: string } }>(`/api/profile/appeals/${firstReportId}`)
        expect(submittedAppealStatus.appeal).toMatchObject({ reason: "Please reconsider this removal." })
        expect(submittedAppealStatus.status).toBe("appealed")
        const bypassAppealResolution = await admin.fetchRaw(`/api/report/${firstReportId}/resolve`, {
            method: "POST",
            body: { resolution: "Resolve without appeal review." },
        })
        expectStatus(bypassAppealResolution, 409, "pending appeal cannot be resolved through the generic route")
        const bypassAppealReopen = await admin.fetchRaw(`/api/report/${firstReportId}/reopen`, { method: "POST" })
        expectStatus(bypassAppealReopen, 409, "pending appeal cannot be reopened")
        const nonOwnerAppeal = await reporter.fetchRaw(`/api/report/${firstReportId}/appeal`, {
            method: "POST",
            body: { reason: "I am not the content owner." },
        })
        expectStatus(nonOwnerAppeal, 403, "non-owner appeal stage")

        const originalModeratorReview = await admin.fetchRaw(`/api/report/${firstReportId}/appeal/reject`, {
            method: "POST",
            body: { resolution: "The original decision-maker cannot review this appeal." },
        })
        expectStatus(originalModeratorReview, 403, "distinct moderator review stage")
        const rejectedAppeal = await reporter.fetchRaw<Array<{
            status: string
            resolution: string
            appeal: { reason: string, time: string, moderator: string }
        }>>(`/api/topic/${topicId}/reports/${firstReportId}/appeal/reject`, {
            method: "POST",
            body: { resolution: "The removal is consistent with the community rules." },
        })
        expectStatus(rejectedAppeal, 200, "appeal rejection stage")
        expect(rejectedAppeal._data![0]).toMatchObject({
            status: "removed",
            resolution: "The removal is consistent with the community rules.",
            appeal: {
                reason: "Please reconsider this removal.",
                moderator: reporter.user.id,
            },
        })
        const rejectedOwnerAppeal = await threadAuthor.fetch<{
            status: string
            resolution: string
            appeal: { reason: string, time: string, moderator: { id: string } }
        }>(`/api/profile/appeals/${firstReportId}`)
        expect(rejectedOwnerAppeal).toMatchObject({
            status: "removed",
            resolution: "The removal is consistent with the community rules.",
            appeal: {
                reason: "Please reconsider this removal.",
                time: expect.any(String),
                moderator: { id: reporter.user.id },
            },
        })
        const stillQuarantined = await admin.fetch<{ status: string }>(`/api/thread/${threadIds[0]}`)
        expect(stillQuarantined.status).toBe("quarantined")

        const secondRemoval = await reporter.fetchRaw(`/api/topic/${topicId}/reports/${secondReportId}/remove`, {
            method: "POST",
            body: { resolution: "The report was confirmed by a moderator." },
        })
        expectStatus(secondRemoval, 200, "second report removal stage")
        const secondAppealResponse = await threadAuthor.fetchRaw(`/api/report/${secondReportId}/appeal`, {
            method: "POST",
            body: { reason: "Please review the context of this thread." },
        })
        expectStatus(secondAppealResponse, 200, "second owner appeal submission stage")

        const acceptedAppeal = await admin.fetchRaw<Array<{
            status: string
            resolution: string
            appeal: { reason: string, time: string, moderator: string }
        }>>(`/api/report/${secondReportId}/appeal/accept`, {
            method: "POST",
            body: { resolution: "The appeal is supported by the additional context." },
        })
        expectStatus(acceptedAppeal, 200, "appeal acceptance stage")
        expect(acceptedAppeal._data![0]).toMatchObject({
            status: "approved",
            resolution: "The appeal is supported by the additional context.",
            appeal: {
                reason: "Please review the context of this thread.",
                moderator: admin.user.id,
            },
        })
        const restoredThread = await admin.fetch<{ status: string }>(`/api/thread/${threadIds[1]}`)
        expect(restoredThread.status).toBe("active")

        for (const reportId of reportIds) {
            const appealLogs = await getModeratorLogs(`report:${reportId}`)
            expect(appealLogs.some(log => log.action === "report.appeal.accepted" || log.action === "report.appeal.rejected")).toBe(true)
        }
    }
    finally {
        await admin.query([
            `UPDATE ${reporter.user.id} SET roles = ${originalRoles};`,
            ...reportIds.map(reportId => `DELETE moderatorLog WHERE target = report:${reportId};`),
            ...reportIds.map(reportId => `DELETE report:${reportId};`),
            ...threadIds.map(threadId => `DELETE thread:${threadId};`),
            `DELETE topic:${topicId};`,
        ].join("\n"))
    }
})

it("shares the report rate limit across report submission routes", async () => {
    const headers = { "X-Forwarded-For": "198.51.100.42" }
    for (let attempt = 0; attempt < 5; attempt++) {
        const response = await fetch("/api/report/send", { method: "POST", headers })
        expectStatus(response, 401)
    }

    await admin.fetch("/api/report")

    const limitedSubmission = await fetch("/api/report/send", { method: "POST", headers })
    expectStatus(limitedSubmission, 429, "sixth report submission is rate limited")

    const limitedResponse = await fetch("/api/post/missing/report", { method: "POST", headers })
    expectStatus(limitedResponse, 429)
})