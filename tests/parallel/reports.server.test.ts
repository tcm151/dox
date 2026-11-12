import { expect, it } from "vitest"
import { expectStatus, fetch, grabExampleServer, grabUser } from "../utils/test-server"
import { extractId } from "../../shared/utils/records"
import type { Comment, Gallery, ModeratorLog, Post, Thread } from "../../shared/types"

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

it("keeps report creation time stable and stores complaints separately from history", async () => {
    const suffix = Date.now()
    const topicId = `reportHistory${suffix}`
    const firstReason = "The thread needs moderator review."
    const secondReason = "Additional context for the report."
    let threadId: string | undefined
    let reportId: string | undefined

    try {
        const threadResponse = await threadAuthor.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content: `Report history test ${suffix}`, topics: [`topic:${topicId}`], images: [] },
        })
        expectStatus(threadResponse, 200)
        const thread = threadResponse._data!
        threadId = extractId(thread.id)

        const firstSubmission = await reporter.fetchRaw("/api/report/send", {
            method: "POST",
            body: { subject: thread.id, reason: firstReason },
            headers: { "X-Forwarded-For": `192.0.2.${suffix % 200 + 1}` },
        })
        expectStatus(firstSubmission, 204)

        type HistoryEntry = {
            action: string
            user: { id: string }
            time: string
            changes: Record<string, unknown>
        }
        type Complaint = {
            user: { id: string }
            reason: string
            time: string
        }
        type ReportView = {
            id: string
            subject: { id: string }
            owner: { id: string, name: string }
            topics: string[]
            moderator?: { id: string }
            time: string
            complaints: Complaint[]
            status: string
            history: HistoryEntry[]
        }

        const firstReports = await admin.fetch<ReportView[]>("/api/report")
        const firstReport = firstReports.find(item => item.subject.id === thread.id)
        expect(firstReport).toBeDefined()
        reportId = extractId(firstReport!.id)
        expect(firstReport).toMatchObject({
            owner: { id: threadAuthor.user.id, name: threadAuthor.user.name },
            topics: expect.arrayContaining([`topic:${topicId}`]),
            status: "pending",
            complaints: [{
                user: { id: reporter.user.id },
                reason: firstReason,
                time: expect.any(String),
            }],
            history: [],
        })
        expect(firstReport!.moderator).toBeUndefined()
        const createdAt = firstReport!.time
        const originalHistory = structuredClone(firstReport!.history)

        const secondSubmission = await reporter.fetchRaw("/api/report/send", {
            method: "POST",
            body: { subject: thread.id, reason: secondReason },
            headers: { "X-Forwarded-For": `192.0.2.${suffix % 200 + 1}` },
        })
        expectStatus(secondSubmission, 204)

        const updatedReports = await admin.fetch<ReportView[]>("/api/report")
        const updatedReport = updatedReports.find(item => item.subject.id === thread.id)
        expect(updatedReport).toBeDefined()
        expect(updatedReport!.id).toBe(firstReport!.id)
        expect(updatedReport!.time).toBe(createdAt)
        expect(updatedReport!.complaints).toHaveLength(2)
        expect(updatedReport!.history).toEqual(originalHistory)
    }
    finally {
        await admin.query([
            ...(reportId ? [`DELETE moderatorLog WHERE target = report:${reportId};`, `DELETE report:${reportId};`] : []),
            ...(threadId ? [`DELETE thread:${threadId};`] : []),
            `DELETE topic:${topicId};`,
        ].join("\n"))
    }
})

it("returns each moderator report once with its assigned topic associations", async () => {
    const suffix = Date.now()
    const content = `Moderator aggregate report ${suffix}`
    const firstTopicId = `aggregateFirst${suffix}`
    const secondTopicId = `aggregateSecond${suffix}`
    const unassignedTopicId = `aggregateUnassigned${suffix}`
    const originalRoles = JSON.stringify(reporter.user.roles)
    let threadId: string | undefined
    let reportId: string | undefined

    try {
        const threadResponse = await threadAuthor.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: {
                content,
                topics: [`topic:${unassignedTopicId}`, `topic:${firstTopicId}`, `topic:${secondTopicId}`],
                images: [],
            },
        })
        expectStatus(threadResponse, 200)
        const thread = threadResponse._data!
        threadId = extractId(thread.id)
        expect(threadId).toBeDefined()

        await admin.query(`
            UPDATE ${reporter.user.id} SET roles += "moderator";
            UPDATE topic:${firstTopicId} SET moderators += ${reporter.user.id};
            UPDATE topic:${secondTopicId} SET moderators += ${reporter.user.id};
        `)

        const reportResponse = await reporter.fetchRaw("/api/report/send", {
            method: "POST",
            body: { subject: thread.id, reason: "This thread should appear once in the aggregate queue." },
            headers: { "X-Forwarded-For": "192.0.2.80" },
        })
        expectStatus(reportResponse, 204)

        const adminReports = await admin.fetch<Array<{ id: string, subject: { id: string } }>>("/api/report")
        const adminReport = adminReports.find(report => report.subject.id === thread.id)
        expect(adminReport).toBeDefined()
        reportId = extractId(adminReport!.id)

        const moderatedTopics = await reporter.fetch<Array<{ id: string }>>("/api/moderator/topics")
        expect(moderatedTopics.map(topic => topic.id)).toEqual(expect.arrayContaining([
            `topic:${firstTopicId}`,
            `topic:${secondTopicId}`,
        ]))
        expect(moderatedTopics.map(topic => topic.id)).not.toContain(`topic:${unassignedTopicId}`)

        const moderatorReports = await reporter.fetch<Array<{ id: string, subject: { id: string }, topics: string[] }>>("/api/moderator/reports")
        const matchedReports = moderatorReports.filter(report => report.subject.id === thread.id)
        expect(matchedReports).toHaveLength(1)
        expect(matchedReports[0]?.topics).toHaveLength(3)
        expect(matchedReports[0]?.topics).toEqual(expect.arrayContaining([
            `topic:${firstTopicId}`,
            `topic:${secondTopicId}`,
            `topic:${unassignedTopicId}`,
        ]))
    }
    finally {
        await admin.query([
            `UPDATE ${reporter.user.id} SET roles = ${originalRoles};`,
            ...(reportId ? [`DELETE moderatorLog WHERE target = report:${reportId};`, `DELETE report:${reportId};`] : []),
            ...(threadId ? [`DELETE thread:${threadId};`] : []),
            `DELETE topic:${firstTopicId};`,
            `DELETE topic:${secondTopicId};`,
            `DELETE topic:${unassignedTopicId};`,
        ].join("\n"))
    }
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
            owner: { id: string, name: string }
            complaints: Array<{ user: { id: string }, reason: string }>
        }>>("/api/report")
        const firstReport = firstReports.find(item => item.subject.id === thread.id)
        expect(firstReport, "first report appears in the admin queue").toBeDefined()
        reportId = extractId(firstReport!.id)
        expect(reportId).toBeDefined()
        expect(firstReport!.owner).toEqual({ id: threadAuthor.user.id, name: threadAuthor.user.name })
        expect(firstReport!.complaints).toHaveLength(1)
        expect(firstReport!.complaints[0]!.user.id).toBe(reporter.user.id)
        expect(await getModeratorLogs(`report:${reportId}`)).toEqual([])

        const topicReports = await admin.fetch<Array<{ subject: { id: string }, owner: { id: string, name: string } }>>(`/api/topic/${topicId}/reports`)
        expect(topicReports.some(item => item.subject.id === thread.id && item.owner.id === threadAuthor.user.id && item.owner.name === threadAuthor.user.name)).toBe(true)

        const secondReportResponse = await reporter.fetchRaw("/api/report/send", {
            method: "POST",
            body: { subject: thread.id, reason: "A second report for this same thread." },
        })
        expectStatus(secondReportResponse, 204, "second report submission stage")

        const reports = await admin.fetch<Array<{
            id: string
            subject: { id: string }
            complaints: Array<{ user: { id: string }, reason: string }>
        }>>("/api/report")
        const listedReports = reports.filter(item => item.subject.id === thread.id)
        expect(listedReports).toHaveLength(1)
        expect(extractId(listedReports[0]!.id)).toBe(reportId)
        expect(listedReports[0]!.complaints).toHaveLength(2)
        expect(listedReports[0]!.complaints.every(item => item.user.id === reporter.user.id)).toBe(true)

        const emptyMessageResponse = await admin.fetchRaw(`/api/report/${reportId}/resolve`, {
            method: "POST",
            body: { message: "  " },
        })
        expectStatus(emptyMessageResponse, 400, "empty report decision message stage")

        const closeResponse = await admin.fetchRaw<Array<{
            status: string
            moderator?: string
            history: Array<{ action: string, message?: string, changes: Record<string, unknown> }>
        }>>(`/api/report/${reportId}/resolve`, {
            method: "POST",
            body: { message: "Reviewed and resolved." },
        })
        expectStatus(closeResponse, 200, "report close stage")
        const closedReports = closeResponse._data!
        expect(closedReports).toHaveLength(1)
        expect(closedReports[0]!.status).toBe("closed")
        expect(closedReports[0]!.moderator).toBe(admin.user.id)
        expect(closedReports[0]!.history.at(-1)).toMatchObject({
            action: "report.approved",
            message: "Reviewed and resolved.",
            user: admin.user.id,
            changes: { status: { before: "pending", after: "closed" } },
        })
        const firstDecisionHistory = structuredClone(closedReports[0]!.history)
        const firstModeratorLog = await getModeratorLogs(`report:${reportId}`)
        expect(firstModeratorLog).toHaveLength(1)
        expect(firstModeratorLog[0]).toMatchObject({
            actor: admin.user.id,
            action: "report.approved",
            target: `report:${reportId}`,
            details: {
                before: { status: "pending" },
                after: { status: "closed", message: "Reviewed and resolved." },
            },
        })

        const laterCloseResponse = await admin.fetchRaw(`/api/report/${reportId}/resolve`, {
            method: "POST",
            body: { message: "Updated decision note." },
        })
        expectStatus(laterCloseResponse, 200, "repeated report decision stage")
        expect(laterCloseResponse._data![0]!.history.at(-1)).toMatchObject({
            action: "report.approved",
            message: "Updated decision note.",
            changes: { status: { before: "closed", after: "closed" } },
        })
        expect(laterCloseResponse._data![0]!.history).toHaveLength(2)
        expect(laterCloseResponse._data![0]!.history[0]).toEqual(firstDecisionHistory[0])
        const closeLogs = await getModeratorLogs(`report:${reportId}`)
        expect(closeLogs).toHaveLength(2)
        expect(closeLogs[1]).toMatchObject({ actor: admin.user.id, action: "report.approved", target: `report:${reportId}` })

        const reportsBeforeComplaint = await admin.fetch<Array<{
            id: string
            subject: { id: string }
            history: Array<{ action: string, message?: string, user: { id: string }, time: string, changes: Record<string, unknown> }>
        }>>("/api/report")
        const reportBeforeComplaint = reportsBeforeComplaint.find(item => item.subject.id === thread.id)
        expect(reportBeforeComplaint).toBeDefined()
        const projectHistory = (history: Array<{
            action: string
            message?: string
            user: { id: string }
            time: string
            changes: Record<string, unknown>
        }>) => history.map(({ user, ...entry }) => ({ ...entry, user: user.id }))
        const historyBeforeComplaint = projectHistory(reportBeforeComplaint!.history)

        const laterReportResponse = await reporter.fetchRaw("/api/report/send", {
            method: "POST",
            body: { subject: thread.id, reason: "Additional context after resolution." },
        })
        expectStatus(laterReportResponse, 204, "later complaint does not reopen report stage")
        const afterLaterReports = await admin.fetch<Array<{
            id: string
            subject: { id: string }
            status: string
            moderator?: { id: string }
            complaints: Array<{ reason: string }>
            history: Array<{ action: string, message?: string, user: { id: string }, time: string, changes: Record<string, unknown> }>
        }>>("/api/report")
        const afterLaterReport = afterLaterReports.find(item => item.subject.id === thread.id)
        expect(afterLaterReport).toMatchObject({
            id: `report:${reportId}`,
            status: "closed",
            moderator: { id: admin.user.id },
        })
        expect(afterLaterReport!.complaints).toHaveLength(3)
        expect(afterLaterReport!.complaints.at(-1)).toMatchObject({ reason: "Additional context after resolution." })
        expect(projectHistory(afterLaterReport!.history)).toEqual(historyBeforeComplaint)
        expect(await getModeratorLogs(`report:${reportId}`)).toHaveLength(2)

        const missingReopenMessage = await admin.fetchRaw(`/api/report/${reportId}/reopen`, { method: "POST" })
        expectStatus(missingReopenMessage, 400, "missing report reopen message stage")
        const emptyReopenMessage = await admin.fetchRaw(`/api/report/${reportId}/reopen`, {
            method: "POST",
            body: { message: " \t " },
        })
        expectStatus(emptyReopenMessage, 400, "empty report reopen message stage")

        const reopenResponse = await admin.fetchRaw<Array<{ status: string, moderator?: string, history: Array<{ action: string, message?: string, changes: Record<string, unknown> }> }>>(`/api/report/${reportId}/reopen`, {
            method: "POST",
            body: { message: "R" },
        })
        expectStatus(reopenResponse, 200, "report reopen stage")
        const reportAfterReopen = reopenResponse._data!
        expect(reportAfterReopen).toHaveLength(1)
        expect(reportAfterReopen[0]!.status).toBe("pending")
        expect(reportAfterReopen[0]!.moderator).toBeUndefined()
        expect(reportAfterReopen[0]!.history.at(-1)).toMatchObject({
            action: "report.reopened",
            message: "R",
            user: admin.user.id,
            changes: { status: { before: "closed", after: "pending" } },
        })
        const reopenedLogs = await getModeratorLogs(`report:${reportId}`)
        expect(reopenedLogs).toHaveLength(3)
        expect(reopenedLogs[2]).toMatchObject({ action: "report.reopened" })

        const missingRemovalMessage = await admin.fetchRaw(`/api/report/${reportId}/remove`, {
            method: "POST",
        })
        expectStatus(missingRemovalMessage, 400, "missing report removal message stage")

        const emptyRemovalMessage = await admin.fetchRaw(`/api/report/${reportId}/remove`, {
            method: "POST",
            body: { message: " " },
        })
        expectStatus(emptyRemovalMessage, 400, "empty report removal message stage")

        const removedResponse = await admin.fetchRaw<Array<{ status: string, history: Array<{ action: string, message?: string, changes: Record<string, unknown> }> }>>(`/api/report/${reportId}/remove`, {
            method: "POST",
            body: { message: "R" },
        })
        expectStatus(removedResponse, 200, "report removal status stage")
        const removedReports = removedResponse._data!
        expect(removedReports).toHaveLength(1)
        expect(removedReports[0]!.status).toBe("removed")
        expect(removedReports[0]!.history.at(-1)).toMatchObject({
            action: "report.removed",
            message: "R",
            changes: { status: { before: "pending", after: "removed" } },
        })
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
            body: { message: "The report was resolved in favor of the owner." },
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
            body: { message: "R" },
        })
        expectStatus(reopenAgainResponse, 200, "closed report can be reopened stage")
        const reopenedAgainLogs = await getModeratorLogs(`report:${reportId}`)
        expect(reopenedAgainLogs).toHaveLength(6)
        expect(reopenedAgainLogs[5]).toMatchObject({ action: "report.reopened" })

        const topicUpdateResponse = await admin.fetchRaw(`/api/topic/${topicId}/reports/${reportId}/resolve`, {
            method: "POST",
            body: { message: "Topic report reviewed." },
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
            moderator?: { id: string }
            complaints: Array<{ reason: string }>
            history: Array<{ action: string, message?: string }>
        }>>("/api/report")
        const reportAfterComplaint = reopenedReports.find(item => item.subject.id === thread.id)
        if (!reportAfterComplaint) throw new Error("Report should remain in the admin queue.")
        expect(extractId(reportAfterComplaint.id)).toBe(reportId)
        expect(reportAfterComplaint.status).toBe("closed")
        expect(reportAfterComplaint.moderator?.id).toBe(admin.user.id)
        expect(reportAfterComplaint.complaints).toHaveLength(4)
            expect(reportAfterComplaint.history.at(-1)).toMatchObject({ action: "report.approved" })
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

it("marks topic reports priority only after enough distinct reporters", async () => {
    const suffix = Date.now()
    const topicId = `reportPriority${suffix}`
    let threadId: string | undefined
    let reportId: string | undefined

    try {
        const threadResponse = await threadAuthor.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content: `Report priority test ${suffix}`, topics: [`topic:${topicId}`], images: [] },
        })
        expectStatus(threadResponse, 200)
        threadId = extractId(threadResponse._data!.id)

        const settingsResponse = await admin.fetchRaw(`/api/topic/${topicId}/update`, {
            method: "POST",
            body: {
                description: "",
                moderation: { maxPostInterval: 60, priorityReportThreshold: 2 },
                rules: "",
            },
        })
        expectStatus(settingsResponse, 200)

        const firstComplaint = await reporter.fetchRaw("/api/report/send", {
            method: "POST",
            body: { subject: threadResponse._data!.id, reason: "First report from the same account." },
            headers: { "X-Forwarded-For": "203.0.113.71" },
        })
        expectStatus(firstComplaint, 204)
        const duplicateComplaint = await reporter.fetchRaw("/api/report/send", {
            method: "POST",
            body: { subject: threadResponse._data!.id, reason: "Additional context from the same account." },
            headers: { "X-Forwarded-For": "203.0.113.72" },
        })
        expectStatus(duplicateComplaint, 204)

        const reportBeforeThreshold = (await admin.fetch<Array<{
            id: string
            subject: { id: string }
            complaints: unknown[]
            priority: boolean
        }>>(`/api/topic/${topicId}/reports`)).find(report => report.subject.id === threadResponse._data!.id)
        expect(reportBeforeThreshold?.complaints).toHaveLength(2)
        expect(reportBeforeThreshold?.priority).toBe(false)
        reportId = extractId(reportBeforeThreshold?.id)

        const secondReporterComplaint = await admin.fetchRaw("/api/report/send", {
            method: "POST",
            body: { subject: threadResponse._data!.id, reason: "A distinct account also reports this subject." },
            headers: { "X-Forwarded-For": "203.0.113.73" },
        })
        expectStatus(secondReporterComplaint, 204)

        const reportAtThreshold = (await admin.fetch<Array<{
            subject: { id: string }
            priority: boolean
        }>>(`/api/topic/${topicId}/reports`)).find(report => report.subject.id === threadResponse._data!.id)
        expect(reportAtThreshold?.priority).toBe(true)
    }
    finally {
        await admin.query([
            ...(reportId ? [`DELETE moderatorLog WHERE target = report:${reportId};`, `DELETE report:${reportId};`] : []),
            ...(threadId ? [`DELETE thread:${threadId};`] : []),
            `DELETE topic:${topicId};`,
        ].join("\n"))
    }
})

it("keeps moderator-owned reports out of topic moderator queues", async () => {
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

            const adminQueue = await admin.fetch<Array<{ id: string, subject: { id: string }, owner: { id: string, name: string } }>>("/api/report")
            const adminReport = adminQueue.find(report => report.subject.id === adminThread.id)
            const moderatorReport = adminQueue.find(report => report.subject.id === moderatorThread.id)
            expect(adminReport?.owner.id).toBe(admin.user.id)
            expect(moderatorReport?.owner.id).toBe(reporter.user.id)
            const adminReportId = extractId(adminReport?.id)
            const moderatorReportId = extractId(moderatorReport?.id)
            expect(adminReportId).toBeDefined()
            expect(moderatorReportId).toBeDefined()
            reportIds.push(adminReportId!, moderatorReportId!)

            const moderatorQueue = await reporter.fetch<Array<{ subject: { id: string } }>>(`/api/topic/${topicId}/reports`)
            expect(moderatorQueue.some(report => report.subject.id === adminThread.id)).toBe(true)
            expect(moderatorQueue.some(report => report.subject.id === moderatorThread.id)).toBe(false)

            for (const [action, body] of [
                ["resolve", { message: "I own this content." }],
                ["remove", { message: "I own this content." }],
                ["reopen", { message: "R" }],
            ] as const) {
                const response = await admin.fetchRaw(`/api/report/${adminReportId}/${action}`, { method: "POST", body })
                expectStatus(response, 403, `admin cannot ${action} own content`)
            }

            const moderatorOwnReport = await reporter.fetchRaw(`/api/topic/${topicId}/reports/${moderatorReportId}/resolve`, {
                method: "POST",
                body: { message: "I own this content." },
            })
            expectStatus(moderatorOwnReport, 403, "moderator cannot approve own content")

            const emptyTopicRemoval = await reporter.fetchRaw(`/api/topic/${topicId}/reports/${adminReportId}/remove-topic`, {
                method: "POST",
                body: { message: " \t " },
            })
            expectStatus(emptyTopicRemoval, 400, "empty topic removal message stage")

            const topicReopen = await reporter.fetchRaw<Array<{ status: string, history: Array<{ action: string, message?: string }> }>>(`/api/topic/${topicId}/reports/${adminReportId}/reopen`, {
                method: "POST",
                body: { message: "R" },
            })
            expectStatus(topicReopen, 200, "topic-scoped report reopen stage")
            expect(topicReopen._data![0]!.history.at(-1)).toMatchObject({ action: "report.reopened", message: "R" })

            const removeTopic = await reporter.fetchRaw<Array<{ history: Array<{ action: string, message?: string }> }>>(`/api/topic/${topicId}/reports/${adminReportId}/remove-topic`, {
                method: "POST",
                body: { message: "R" },
            })
            expectStatus(removeTopic, 200, "moderator removes only the topic association")
            expect(removeTopic._data![0]!.history.at(-1)).toMatchObject({ action: "report.topic.removed", message: "R" })

            const recusedQueue = await reporter.fetch<Array<{ subject: { id: string } }>>(`/api/topic/${topicId}/reports`)
            expect(recusedQueue.some(report => report.subject.id === adminThread.id)).toBe(false)
            const finalAdminQueue = await admin.fetch<Array<{ subject: { id: string } }>>("/api/report")
            expect(finalAdminQueue.some(report => report.subject.id === adminThread.id)).toBe(true)
            const unchangedContent = await admin.fetch<Thread>(`/api/thread/${extractId(adminThread.id)}`)
            expect(unchangedContent.status).toBe("active")
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

it("lets a topic moderator remove one topic without removing the submission or report", async () => {
    const content = `Topic removal test ${Date.now()}`
    const removedTopicId = `removedTopic${Date.now()}`
    const retainedTopicId = `retainedTopic${Date.now()}`
    const originalRoles = JSON.stringify(reporter.user.roles)
    const threadIds: string[] = []
    const reportIds: string[] = []

    try {
        await admin.query(`UPDATE ${reporter.user.id} SET roles = ["moderator"];`)

        const submissionResponse = await threadAuthor.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content, topics: [`topic:${removedTopicId}`, `topic:${retainedTopicId}`], images: [] },
        })
        expectStatus(submissionResponse, 200, "multi-topic submission stage")
        const submission = submissionResponse._data!
        const submissionId = extractId(submission.id)!
        threadIds.push(submissionId)

        const topicSettingsResponse = await admin.fetchRaw(`/api/topic/${removedTopicId}/update`, {
            method: "POST",
            body: {
                description: "",
                moderation: { maxPostInterval: 0, priorityReportThreshold: 5 },
                rules: "",
            },
        })
        expectStatus(topicSettingsResponse, 200, "disable topic cooldown for multi-topic fixture")

        const anchorResponse = await threadAuthor.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content: `${content} anchor`, topics: [`topic:${removedTopicId}`], images: [] },
        })
        expectStatus(anchorResponse, 200, "topic anchor stage")
        threadIds.push(extractId(anchorResponse._data!.id)!)

        await admin.query(`
            UPDATE topic:${removedTopicId} SET moderators += ${reporter.user.id};
            UPDATE topic:${retainedTopicId} SET moderators += ${reporter.user.id};
        `)

        const reportResponse = await reporter.fetchRaw("/api/report/send", {
            method: "POST",
            body: { subject: submission.id, reason: "This submission is unrelated to one topic." },
            headers: { "X-Forwarded-For": "203.0.113.53" },
        })
        expectStatus(reportResponse, 204, "multi-topic report stage")

        const beforeReports = await admin.fetch<Array<{ id: string, subject: { id: string } }>>("/api/report")
        const beforeReport = beforeReports.find(report => report.subject.id === submission.id)
        expect(beforeReport).toBeDefined()
        const reportId = extractId(beforeReport!.id)!
        reportIds.push(reportId)

        const removeTopicResponse = await reporter.fetchRaw(`/api/topic/${removedTopicId}/reports/${reportId}/remove-topic`, {
            method: "POST",
            body: { message: "This submission does not belong in this topic." },
        })
        expectStatus(removeTopicResponse, 200, "moderator removes topic association stage")

        const submissionAfterRemoval = await admin.fetch<Thread>(`/api/thread/${submissionId}`)
        expect(submissionAfterRemoval.status).toBe("active")
        expect(submissionAfterRemoval.topics).not.toContain(`topic:${removedTopicId}`)
        expect(submissionAfterRemoval.topics).toContain(`topic:${retainedTopicId}`)

        const removedTopicReports = await reporter.fetch<Array<{ id: string }>>(`/api/topic/${removedTopicId}/reports`)
        expect(removedTopicReports.some(report => report.id === `report:${reportId}`)).toBe(false)
        const retainedTopicReports = await reporter.fetch<Array<{ id: string }>>(`/api/topic/${retainedTopicId}/reports`)
        expect(retainedTopicReports.filter(report => report.id === `report:${reportId}`)).toHaveLength(1)
        const afterReports = await admin.fetch<Array<{ id: string, subject: { id: string }, status: string }>>("/api/report")
        expect(afterReports.filter(report => report.subject.id === submission.id)).toMatchObject([
            { id: `report:${reportId}`, status: "pending" },
        ])
        const reportAfterTopicRemoval = (await admin.fetch<Array<{ id: string, subject: { id: string }, history: Array<{ action: string, message?: string, user: { id: string }, changes: Record<string, unknown> }> }>>("/api/report"))
            .find(report => report.subject.id === submission.id)
        const topicRemovalHistory = reportAfterTopicRemoval?.history.at(-1)
        expect(topicRemovalHistory).toMatchObject({
            action: "report.topic.removed",
            user: { id: reporter.user.id },
        })
        expect(topicRemovalHistory?.message).toBe("This submission does not belong in this topic.")
        expect(topicRemovalHistory?.changes.topic).toBe(`topic:${removedTopicId}`)

        const forbiddenContentRemoval = await reporter.fetchRaw(`/api/topic/${retainedTopicId}/reports/${reportId}/remove`, {
            method: "POST",
            body: { message: "This should require an administrator." },
        })
        expectStatus(forbiddenContentRemoval, 403, "moderator full-content removal authorization")

        const moderatorLogs = await getModeratorLogs(`report:${reportId}`)
        expect(moderatorLogs).toHaveLength(1)
        expect(moderatorLogs[0]).toMatchObject({
            actor: reporter.user.id,
            action: "report.topic.removed",
            target: `report:${reportId}`,
            details: { topic: `topic:${removedTopicId}` },
        })
    }
    finally {
        await admin.query([
            `UPDATE ${reporter.user.id} SET roles = ${originalRoles};`,
            ...reportIds.map(reportId => `DELETE moderatorLog WHERE target = report:${reportId};`),
            ...reportIds.map(reportId => `DELETE report:${reportId};`),
            ...threadIds.map(threadId => `DELETE thread:${threadId};`),
            `DELETE topic:${removedTopicId};`,
            `DELETE topic:${retainedTopicId};`,
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

        const topicSettingsResponse = await admin.fetchRaw(`/api/topic/${topicId}/update`, {
            method: "POST",
            body: {
                description: "",
                moderation: { maxPostInterval: 0, priorityReportThreshold: 5 },
                rules: "",
            },
        })
        expectStatus(topicSettingsResponse, 200, "disable topic cooldown for appeal fixture")

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

        const firstRemoval = await admin.fetchRaw<Array<{
            status: string
            moderator: string
            history: Array<{ action: string, message?: string, user: string, changes: Record<string, unknown> }>
        }>>(`/api/report/${firstReportId}/remove`, {
            method: "POST",
            body: { message: "The content violated community rules." },
        })
        expectStatus(firstRemoval, 200, "first report removal stage")
        const originalRemovalHistory = structuredClone(firstRemoval._data![0]!.history)
        expect(firstRemoval._data![0]!.moderator).toBe(admin.user.id)

        const ownerNotifications = await threadAuthor.fetch<{ notifications: Array<{ context: string, message: string }> }>("/api/profile/notifications?dismissed=false&amount=100")
        const removalNotification = ownerNotifications.notifications.find(notification => notification.context === `report:${firstReportId}` && /quarantin/i.test(notification.message))
        expect(removalNotification).toBeDefined()
        expect(removalNotification?.message).not.toContain("[Open appeal]")

        const ownerAppealStatus = await threadAuthor.fetchRaw<{
            status: string
            moderator: { id: string }
            history: Array<{ action: string, message?: string, user: string, changes: Record<string, unknown> }>
        }>(`/api/profile/appeals/${firstReportId}`)
        expectStatus(ownerAppealStatus, 200, "owner appeal status stage")
        expect(ownerAppealStatus._data).toMatchObject({
            status: "removed",
            moderator: { id: admin.user.id },
        })

        const nonOwnerAppealStatus = await reporter.fetchRaw(`/api/profile/appeals/${firstReportId}`)
        expectStatus(nonOwnerAppealStatus, 204, "non-owner appeal status stage")
        expect(nonOwnerAppealStatus._data).toBeUndefined()

        const emptyAppeal = await threadAuthor.fetchRaw(`/api/report/${firstReportId}/appeal`, {
            method: "POST",
            body: { reason: " \t " },
        })
        expectStatus(emptyAppeal, 400, "empty appeal reason stage")
        const firstAppealResponse = await threadAuthor.fetchRaw<Array<{ moderator: string, history: Array<{ action: string, message?: string, user: string, changes: Record<string, unknown> }> }>>(
            `/api/report/${firstReportId}/appeal`,
            { method: "POST", body: { reason: "R" } },
        )
        expectStatus(firstAppealResponse, 200, "owner appeal submission stage")
        expect(firstAppealResponse._data![0]!.status).toBe("appealed")
        expect(firstAppealResponse._data![0]!.moderator).toBe(admin.user.id)
        expect(firstAppealResponse._data![0]!.history[0]).toEqual(originalRemovalHistory[0])
        expect(firstAppealResponse._data![0]!.history.at(-1)).toMatchObject({
            action: "report.appeal.submitted",
            message: "R",
            user: threadAuthor.user.id,
            changes: { status: { before: "removed", after: "appealed" } },
        })
        expect(firstAppealResponse._data![0]).not.toHaveProperty("appeal")
        const duplicateAppeal = await threadAuthor.fetchRaw(`/api/report/${firstReportId}/appeal`, {
            method: "POST",
            body: { reason: "A second appeal should not be accepted." },
        })
        expectStatus(duplicateAppeal, 409, "one appeal per report stage")
        const submittedAppealStatus = await threadAuthor.fetch<{ history: Array<{ action: string, message?: string }> }>(`/api/profile/appeals/${firstReportId}`)
        expect(submittedAppealStatus.history.at(-1)).toMatchObject({ action: "report.appeal.submitted", message: "R" })
        expect(submittedAppealStatus.status).toBe("appealed")
        const bypassAppealResolution = await admin.fetchRaw(`/api/report/${firstReportId}/resolve`, {
            method: "POST",
            body: { message: "Resolve without appeal review." },
        })
        expectStatus(bypassAppealResolution, 409, "pending appeal cannot be resolved through the generic route")
        const bypassAppealReopen = await admin.fetchRaw(`/api/report/${firstReportId}/reopen`, { method: "POST", body: { message: "R" } })
        expectStatus(bypassAppealReopen, 409, "pending appeal cannot be reopened")
        const nonOwnerAppeal = await reporter.fetchRaw(`/api/report/${firstReportId}/appeal`, {
            method: "POST",
            body: { reason: "I am not the content owner." },
        })
        expectStatus(nonOwnerAppeal, 403, "non-owner appeal stage")

        const originalModeratorReview = await admin.fetchRaw(`/api/report/${firstReportId}/appeal/reject`, {
            method: "POST",
            body: { message: "The original decision-maker cannot review this appeal." },
        })
        expectStatus(originalModeratorReview, 403, "distinct moderator review stage")

        const emptyAppealDecision = await reporter.fetchRaw(`/api/topic/${topicId}/reports/${firstReportId}/appeal/reject`, {
            method: "POST",
            body: { message: " " },
        })
        expectStatus(emptyAppealDecision, 400, "empty appeal decision message stage")
        const rejectedAppeal = await reporter.fetchRaw<Array<{
            status: string
            moderator: string
            history: Array<{ action: string, message?: string, user: string, changes: Record<string, unknown> }>
        }>>(`/api/topic/${topicId}/reports/${firstReportId}/appeal/reject`, {
            method: "POST",
            body: { message: "R" },
        })
        expectStatus(rejectedAppeal, 200, "appeal rejection stage")
        expect(rejectedAppeal._data![0]).toMatchObject({
            status: "denied",
            moderator: reporter.user.id,
        })
        expect(rejectedAppeal._data![0]!.history.at(-1)).toMatchObject({
            action: "report.appeal.rejected",
            message: "R",
            user: reporter.user.id,
            changes: { status: { before: "appealed", after: "denied" } },
        })
        const rejectedOwnerAppeal = await threadAuthor.fetch<{
            status: string
            moderator: { id: string }
            history: Array<{ action: string, message?: string }>
        }>(`/api/profile/appeals/${firstReportId}`)
        expect(rejectedOwnerAppeal).toMatchObject({
            status: "denied",
            moderator: { id: reporter.user.id },
        })
        expect(rejectedOwnerAppeal.history.at(-1)).toMatchObject({ action: "report.appeal.rejected" })
        const stillQuarantined = await admin.fetch<{ status: string }>(`/api/thread/${threadIds[0]}`)
        expect(stillQuarantined.status).toBe("quarantined")

        const secondRemoval = await admin.fetchRaw(`/api/report/${secondReportId}/remove`, {
            method: "POST",
            body: { message: "The report was confirmed by a moderator." },
        })
        expectStatus(secondRemoval, 200, "administrator removes content stage")
        const secondAppealResponse = await threadAuthor.fetchRaw(`/api/report/${secondReportId}/appeal`, {
            method: "POST",
            body: { reason: "Please review the context of this thread." },
        })
        expectStatus(secondAppealResponse, 200, "second owner appeal submission stage")

        const emptyAcceptedAppealDecision = await reporter.fetchRaw(`/api/topic/${topicId}/reports/${secondReportId}/appeal/accept`, {
            method: "POST",
            body: { message: " " },
        })
        expectStatus(emptyAcceptedAppealDecision, 400, "empty accepted appeal decision message stage")
        const acceptedAppeal = await reporter.fetchRaw<Array<{
            status: string
            moderator: string
            history: Array<{ action: string, message?: string, user: string, changes: Record<string, unknown> }>
        }>>(`/api/topic/${topicId}/reports/${secondReportId}/appeal/accept`, {
            method: "POST",
            body: { message: "R" },
        })
        expectStatus(acceptedAppeal, 200, "distinct topic moderator accepts appeal stage")
        expect(acceptedAppeal._data![0]).toMatchObject({
            status: "closed",
            moderator: reporter.user.id,
        })
        expect(acceptedAppeal._data![0]!.history.at(-1)).toMatchObject({
            action: "report.appeal.accepted",
            message: "R",
            user: reporter.user.id,
            changes: { status: { before: "appealed", after: "closed" } },
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

it("reports comments in inherited topic queues and quarantines only the comment", async () => {
    const suffix = Date.now()
    const topicId = `commentReport${suffix}`
    const originalRoles = JSON.stringify(reporter.user.roles)
    let postId: string | undefined
    let commentId: string | undefined
    let replyId: string | undefined
    let reportId: string | undefined
    let imageId: string | undefined
    let galleryId: string | undefined
    let galleryCommentId: string | undefined
    let galleryReportId: string | undefined

    try {
        const postResponse = await threadAuthor.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: {
                title: `Comment report ${suffix}`,
                content: "Post context for the comment report.",
                topics: [`topic:${topicId}`],
                images: [],
            },
        })
        expectStatus(postResponse, 200, "comment report post creation stage")
        const post = postResponse._data!
        postId = extractId(post.id)

        const commentResponse = await threadAuthor.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: { context: post.id, replyTo: post.id, content: `Reported comment ${suffix}` },
        })
        expectStatus(commentResponse, 200, "reported comment creation stage")
        const comment = commentResponse._data!
        commentId = extractId(comment.id)

        const replyResponse = await reporter.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: { context: post.id, replyTo: comment.id, content: `Reply to reported comment ${suffix}` },
        })
        expectStatus(replyResponse, 200, "reported comment reply creation stage")
        const reply = replyResponse._data!
        replyId = extractId(reply.id)

        await admin.query(`
            UPDATE ${reporter.user.id} SET roles += "moderator";
            UPDATE topic:${topicId} SET moderators += ${reporter.user.id};
        `)

        const reportResponse = await reporter.fetchRaw("/api/report/send", {
            method: "POST",
            body: { subject: comment.id, reason: "This comment needs moderator review." },
            headers: { "X-Forwarded-For": `203.0.113.${suffix % 200 + 1}` },
        })
        expectStatus(reportResponse, 204, "comment report submission stage")

        type CommentReportView = {
            id: string
            subject: { id: string, content: string, context: string | { id: string } }
            owner: { id: string, name: string }
            topics: string[]
            status: string
        }
        const adminReports = await admin.fetch<CommentReportView[]>("/api/report")
        const report = adminReports.find(item => item.subject.id === comment.id)
        expect(report).toBeDefined()
        expect(report!.subject.content).toBe(comment.content)
        expect(report!.owner).toEqual({ id: threadAuthor.user.id, name: threadAuthor.user.name })
        expect(report!.topics).toEqual([`topic:${topicId}`])
        expect(report!.status).toBe("pending")
        reportId = extractId(report!.id)

        const topicReports = await reporter.fetch<CommentReportView[]>(`/api/topic/${topicId}/reports`)
        expect(topicReports.some(item => item.id === report!.id)).toBe(true)
        const moderatorReports = await reporter.fetch<CommentReportView[]>("/api/moderator/reports")
        expect(moderatorReports.some(item => item.id === report!.id)).toBe(true)

        imageId = `commentReportImage${suffix}`
        await admin.query(`CREATE ONLY image:${imageId} SET user = ${admin.user.id}, type = "jpeg", origin = "https://example.invalid", tokens = 0;`)
        const publishGallery = await admin.fetchRaw("/api/gallery/publish", {
            method: "POST",
            body: {
                images: [`image:${imageId}`],
                description: `Gallery for comment report ${suffix}`,
                topics: [`topic:${topicId}`],
            },
        })
        expectStatus(publishGallery, 200, "gallery comment report context stage")
        const galleries = await admin.fetch<Gallery[]>("/api/gallery")
        const gallery = galleries.find(item => item.images.some(image => image.id === `image:${imageId}`))
        expect(gallery).toBeDefined()
        galleryId = extractId(gallery!.id)

        const galleryCommentResponse = await threadAuthor.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: { context: gallery!.id, replyTo: gallery!.id, content: `Reported gallery comment ${suffix}` },
        })
        expectStatus(galleryCommentResponse, 200, "gallery comment creation stage")
        const galleryComment = galleryCommentResponse._data!
        galleryCommentId = extractId(galleryComment.id)

        const galleryReportResponse = await reporter.fetchRaw("/api/report/send", {
            method: "POST",
            body: { subject: galleryComment.id, reason: "This gallery comment needs moderator review." },
            headers: { "X-Forwarded-For": `198.51.100.${suffix % 200 + 1}` },
        })
        expectStatus(galleryReportResponse, 204, "gallery comment report submission stage")
        const galleryReports = await reporter.fetch<CommentReportView[]>(`/api/topic/${topicId}/reports`)
        const galleryReport = galleryReports.find(item => item.subject.id === galleryComment.id)
        expect(galleryReport?.owner).toEqual({ id: threadAuthor.user.id, name: threadAuthor.user.name })
        expect(galleryReport?.topics).toEqual([`topic:${topicId}`])
        galleryReportId = extractId(galleryReport?.id)

        const removeTopicResponse = await reporter.fetchRaw(`/api/topic/${topicId}/reports/${reportId}/remove-topic`, {
            method: "POST",
            body: { message: "This must not change the parent submission." },
        })
        expectStatus(removeTopicResponse, 409, "comment topic cannot be removed from its parent")

        const removal = await admin.fetchRaw(`/api/report/${reportId}/remove`, {
            method: "POST",
            body: { message: "The comment violates community rules." },
        })
        expectStatus(removal, 200, "comment quarantine stage")
        const moderatedPost = await admin.fetch<Post>(`/api/post/${postId}`)
        expect(moderatedPost.status).toBe("active")
        expect(moderatedPost.comments.map(item => item.id)).toEqual(expect.arrayContaining([comment.id, reply.id]))
        expect(moderatedPost.comments.find(item => item.id === comment.id)?.status).toBe("quarantined")
        expect(moderatedPost.topics).toContain(`topic:${topicId}`)
        const quarantinedSearchResults = await admin.fetch<Array<{ id: string }>>(`/api/feed/search?text=${encodeURIComponent(comment.content)}`)
        expect(quarantinedSearchResults.map(item => item.id)).not.toContain(comment.id)

        const unauthorizedAppeal = await reporter.fetchRaw(`/api/report/${reportId}/appeal`, {
            method: "POST",
            body: { reason: "I am not the comment owner." },
        })
        expectStatus(unauthorizedAppeal, 403, "comment reporter cannot appeal for its owner")
        const appeal = await threadAuthor.fetchRaw(`/api/report/${reportId}/appeal`, {
            method: "POST",
            body: { reason: "Please review the comment in context." },
        })
        expectStatus(appeal, 200, "comment owner appeal stage")
        expect(appeal._data![0]!.status).toBe("appealed")

        const acceptAppeal = await reporter.fetchRaw(`/api/topic/${topicId}/reports/${reportId}/appeal/accept`, {
            method: "POST",
            body: { message: "The comment is acceptable in context." },
        })
        expectStatus(acceptAppeal, 200, "topic moderator restores comment stage")
        const restoredPost = await admin.fetch<Post>(`/api/post/${postId}`)
        expect(restoredPost.status).toBe("active")
        expect(restoredPost.comments.find(item => item.id === comment.id)?.status).toBe("active")
        expect(restoredPost.comments.some(item => item.id === reply.id)).toBe(true)
        const restoredSearchResults = await admin.fetch<Array<{ id: string }>>(`/api/feed/search?text=${encodeURIComponent(comment.content)}`)
        expect(restoredSearchResults.map(item => item.id)).toContain(comment.id)
    }
    finally {
        await admin.query([
            `UPDATE ${reporter.user.id} SET roles = ${originalRoles};`,
            ...(reportId ? [`DELETE moderatorLog WHERE target = report:${reportId};`, `DELETE report:${reportId};`] : []),
            ...(galleryReportId ? [`DELETE report:${galleryReportId};`] : []),
            ...(reportId ? [`DELETE notification WHERE context = report:${reportId};`] : []),
            ...(commentId ? [`DELETE notification WHERE context = comment:${commentId};`] : []),
            ...(postId ? [`DELETE notification WHERE context = post:${postId};`] : []),
            ...(galleryId ? [`DELETE notification WHERE context = gallery:${galleryId};`] : []),
            ...(galleryCommentId ? [`DELETE comment:${galleryCommentId};`] : []),
            ...(galleryId ? [`DELETE gallery:${galleryId};`] : []),
            ...(imageId ? [`DELETE image:${imageId};`, `DELETE mediaTrash:${imageId};`] : []),
            ...(replyId ? [`DELETE comment:${replyId};`] : []),
            ...(commentId ? [`DELETE comment:${commentId};`] : []),
            ...(postId ? [`DELETE post:${postId};`] : []),
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