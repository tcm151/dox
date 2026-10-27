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
            complaints: Array<{ reporter: { id: string }, reason: string }>
        }>>("/api/report")
        const firstReport = firstReports.find(item => item.subject.id === thread.id)
        expect(firstReport, "first report appears in the admin queue").toBeDefined()
        reportId = extractId(firstReport!.id)
        expect(reportId).toBeDefined()
        expect(firstReport!.complaints).toHaveLength(1)
        expect(firstReport!.complaints[0]!.reporter.id).toBe(reporter.user.id)
        expect(await getModeratorLogs(`report:${reportId}`)).toEqual([])

        const topicReports = await admin.fetch<Array<{ subject: { id: string } }>>(`/api/topic/${topicId}/reports`)
        expect(topicReports.some(item => item.subject.id === thread.id)).toBe(true)

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

        const invalidStatusResponse = await admin.fetchRaw(`/api/report/${reportId}/update`, {
            method: "PUT",
            body: { status: "closed", resolution: "Reviewed and resolved." },
        })
        expectStatus(invalidStatusResponse, 400, "invalid report status stage")

        const shortResolutionResponse = await admin.fetchRaw(`/api/report/${reportId}/update`, {
            method: "PUT",
            body: { status: "resolved", resolution: "No" },
        })
        expectStatus(shortResolutionResponse, 400, "short report resolution stage")

        const resolutionResponse = await admin.fetchRaw<Array<{
            resolution?: string
            status: string
            moderator?: string
        }>>(`/api/report/${reportId}/update`, {
            method: "PUT",
            body: { status: "resolved", resolution: "Reviewed and resolved." },
        })
        expectStatus(resolutionResponse, 200, "report resolution stage")
        const resolvedReports = resolutionResponse._data!
        expect(resolvedReports).toHaveLength(1)
        expect(resolvedReports[0]!.resolution).toBe("Reviewed and resolved.")
        expect(resolvedReports[0]!.status).toBe("resolved")
        expect(resolvedReports[0]!.moderator).toBe(admin.user.id)
        expect(resolvedReports[0]).not.toHaveProperty("moderatorEvent")
        const firstModeratorLog = await getModeratorLogs(`report:${reportId}`)
        expect(firstModeratorLog).toHaveLength(1)
        expect(firstModeratorLog[0]).toMatchObject({
            actor: admin.user.id,
            action: "report.resolved",
            target: `report:${reportId}`,
            details: {
                before: { status: "pending" },
                after: { status: "resolved", resolution: "Reviewed and resolved." },
            },
        })

        const resolutionEditResponse = await admin.fetchRaw(`/api/report/${reportId}/update`, {
            method: "PUT",
            body: { status: "resolved", resolution: "Updated decision note." },
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
            status: "resolved",
            resolution: "Updated decision note.",
            moderator: { id: admin.user.id },
        })
        expect(afterLaterReport!.complaints).toHaveLength(3)
        expect(await getModeratorLogs(`report:${reportId}`)).toHaveLength(2)

        const clearResolutionResponse = await admin.fetchRaw<Array<{ resolution?: string }>>(`/api/report/${reportId}/update`, {
            method: "PUT",
            body: { status: "pending" },
        })
        expectStatus(clearResolutionResponse, 200, "report resolution clear stage")
        const clearedReports = clearResolutionResponse._data!
        expect(clearedReports).toHaveLength(1)
        expect(clearedReports[0]!.resolution).toBeUndefined()
        const reopenedLogs = await getModeratorLogs(`report:${reportId}`)
        expect(reopenedLogs).toHaveLength(3)
        expect(reopenedLogs[2]).toMatchObject({ action: "report.reopened" })

        const removedResponse = await admin.fetchRaw<Array<{ status: string }>>(`/api/report/${reportId}/update`, {
            method: "PUT",
            body: { status: "removed" },
        })
        expectStatus(removedResponse, 200, "report removal status stage")
        const removedReports = removedResponse._data!
        expect(removedReports).toHaveLength(1)
        expect(removedReports[0]!.status).toBe("removed")
        const removedLogs = await getModeratorLogs(`report:${reportId}`)
        expect(removedLogs).toHaveLength(4)
        expect(removedLogs[3]).toMatchObject({ action: "report.removed" })

        const topicUpdateResponse = await admin.fetchRaw(`/api/topic/${topicId}/reports/${reportId}/update`, {
            method: "PUT",
            body: { status: "resolved", resolution: "Topic report reviewed." },
        })
        expectStatus(topicUpdateResponse, 200, "topic report update stage")
        const topicUpdateLogs = await getModeratorLogs(`report:${reportId}`)
        expect(topicUpdateLogs).toHaveLength(5)
        expect(topicUpdateLogs[4]).toMatchObject({ action: "report.resolved" })

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
        expect(reportAfterComplaint.status).toBe("resolved")
        expect(reportAfterComplaint.resolution).toBe("Topic report reviewed.")
        expect(reportAfterComplaint.moderator?.id).toBe(admin.user.id)
        expect(reportAfterComplaint.complaints).toHaveLength(4)
        expect(await getModeratorLogs(`report:${reportId}`)).toHaveLength(5)
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