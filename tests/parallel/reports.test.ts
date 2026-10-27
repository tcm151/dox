import { expect, it } from "vitest"
import { fetch, grabExampleServer, grabUser } from "../test-server"
import { extractId } from "../../shared/utils/records"
import type { ModeratorLog, Thread } from "../../shared/types"

const admin = await grabUser("admin")
const exampleServer = await grabExampleServer("default")
const threadAuthor = exampleServer.users.threadAuthor
const reporter = exampleServer.users.commentAuthor

async function removeRecords(statements: string[]) {
    const response = await fetch("/api/developer/database/query", {
        method: "POST",
        headers: {
            Authorization: admin.accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: statements.join("\n") }),
    })
    if (!response.ok) {
        throw new Error(`Failed to clean up report test records: ${await response.text()}`)
    }
}

async function getModeratorLogs(target: string) {
    const response = await fetch("/api/developer/database/query", {
        method: "POST",
        headers: {
            Authorization: admin.accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: `SELECT * FROM moderatorLog WHERE target = ${target};` }),
    })
    if (!response.ok) {
        throw new Error(`Failed to read moderator log test records: ${await response.text()}`)
    }
    const results = await response.json() as ModeratorLog[][]
    return results[0] ?? []
}

it("rejects report submissions without authentication", async () => {
    const response = await fetch("/api/report/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: "thread:missing" }),
    })
    expect(response.status).toBe(401)
})

it("lists a report in administrator and topic queues", async () => {
    const content = `Report test subject ${Date.now()}`
    const topicId = `reportQueue${Date.now()}`
    let threadId: string | undefined
    let reportId: string | undefined

    try {
        const threadResponse = await fetch("/api/thread/add", {
            method: "POST",
            headers: {
                Authorization: threadAuthor.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content, topics: [`topic:${topicId}`], images: [] }),
        })
        expect(threadResponse.status, "report subject creation stage").toBe(200)
        const thread = await threadResponse.json() as Thread
        threadId = extractId(thread.id)
        expect(threadId).toBeDefined()

        const reportResponse = await fetch("/api/report/send", {
            method: "POST",
            headers: {
                Authorization: reporter.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ subject: thread.id, reason: "This thread violates the community rules." }),
        })
        expect(reportResponse.status, "report submission stage").toBe(204)
        const firstReportsResponse = await fetch("/api/report", {
            headers: { Authorization: admin.accessToken },
        })
        expect(firstReportsResponse.status, "first report list stage").toBe(200)
        const firstReports = await firstReportsResponse.json() as Array<{
            id: string
            subject: { id: string }
            complaints: Array<{ reporter: { id: string }, reason: string }>
        }>
        const firstReport = firstReports.find(item => item.subject.id === thread.id)
        expect(firstReport, "first report appears in the admin queue").toBeDefined()
        reportId = extractId(firstReport!.id)
        expect(reportId).toBeDefined()
        expect(firstReport!.complaints).toHaveLength(1)
        expect(firstReport!.complaints[0]!.reporter.id).toBe(reporter.user.id)
        expect(await getModeratorLogs(`report:${reportId}`)).toEqual([])

        const topicReportsResponse = await fetch(`/api/topic/${topicId}/reports`, {
            headers: { Authorization: admin.accessToken },
        })
        expect(topicReportsResponse.status, "topic report-list stage").toBe(200)
        const topicReports = await topicReportsResponse.json() as Array<{ subject: { id: string } }>
        expect(topicReports.some(item => item.subject.id === thread.id)).toBe(true)

        const secondReportResponse = await fetch("/api/report/send", {
            method: "POST",
            headers: {
                Authorization: reporter.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ subject: thread.id, reason: "A second report for this same thread." }),
        })
        expect(secondReportResponse.status, "second report submission stage").toBe(204)

        const reportsResponse = await fetch("/api/report", {
            headers: { Authorization: admin.accessToken },
        })
        expect(reportsResponse.status, "admin report-list stage").toBe(200)
        const reports = await reportsResponse.json() as Array<{
            id: string
            subject: { id: string }
            complaints: Array<{ reporter: { id: string }, reason: string }>
        }>
        const listedReports = reports.filter(item => item.subject.id === thread.id)
        expect(listedReports).toHaveLength(1)
        expect(extractId(listedReports[0]!.id)).toBe(reportId)
        expect(listedReports[0]!.complaints).toHaveLength(2)
        expect(listedReports[0]!.complaints.every(item => item.reporter.id === reporter.user.id)).toBe(true)

        const invalidStatusResponse = await fetch(`/api/report/${reportId}/update`, {
            method: "PUT",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "closed", resolution: "Reviewed and resolved." }),
        })
        expect(invalidStatusResponse.status, "invalid report status stage").toBe(400)

        const shortResolutionResponse = await fetch(`/api/report/${reportId}/update`, {
            method: "PUT",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "resolved", resolution: "No" }),
        })
        expect(shortResolutionResponse.status, "short report resolution stage").toBe(400)

        const resolutionResponse = await fetch(`/api/report/${reportId}/update`, {
            method: "PUT",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "resolved", resolution: "Reviewed and resolved." }),
        })
        const resolutionResponseBody = await resolutionResponse.text()
        expect(resolutionResponse.status, `report resolution stage: ${resolutionResponseBody}`).toBe(200)
        const resolvedReports = JSON.parse(resolutionResponseBody) as Array<{
            resolution?: string
            status: string
            moderator?: string
        }>
        expect(resolvedReports).toHaveLength(1)
        expect(resolvedReports[0]!.resolution).toBe("Reviewed and resolved.")
        expect(resolvedReports[0]!.status).toBe("resolved")
        expect(resolvedReports[0]!.moderator).toBe(admin.user.id)
        expect(resolvedReports[0]).not.toHaveProperty("moderatorEvent")
        const firstModeratorLog = await getModeratorLogs(`report:${reportId}`)
        expect(firstModeratorLog).toHaveLength(1)
        expect(firstModeratorLog[0]).toMatchObject({
            actor: admin.user.id,
            action: "report.updated",
            target: `report:${reportId}`,
            details: {
                before: { status: "pending" },
                after: { status: "resolved", resolution: "Reviewed and resolved." },
            },
        })

        const laterReportResponse = await fetch("/api/report/send", {
            method: "POST",
            headers: {
                Authorization: reporter.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ subject: thread.id, reason: "Additional context after resolution." }),
        })
        expect(laterReportResponse.status, "later complaint does not reopen report stage").toBe(204)
        const afterLaterReportResponse = await fetch("/api/report", {
            headers: { Authorization: admin.accessToken },
        })
        expect(afterLaterReportResponse.status, "report state after later complaint stage").toBe(200)
        const afterLaterReports = await afterLaterReportResponse.json() as Array<{
            id: string
            subject: { id: string }
            status: string
            resolution?: string
            moderator?: { id: string }
            complaints: Array<{ reason: string }>
        }>
        const afterLaterReport = afterLaterReports.find(item => item.subject.id === thread.id)
        expect(afterLaterReport).toMatchObject({
            id: `report:${reportId}`,
            status: "resolved",
            resolution: "Reviewed and resolved.",
            moderator: { id: admin.user.id },
        })
        expect(afterLaterReport!.complaints).toHaveLength(3)
        expect(await getModeratorLogs(`report:${reportId}`)).toHaveLength(1)

        const clearResolutionResponse = await fetch(`/api/report/${reportId}/update`, {
            method: "PUT",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "pending" }),
        })
        expect(clearResolutionResponse.status, "report resolution clear stage").toBe(200)
        const clearedReports = await clearResolutionResponse.json() as Array<{ resolution?: string }>
        expect(clearedReports).toHaveLength(1)
        expect(clearedReports[0]!.resolution).toBeUndefined()

        const removedResponse = await fetch(`/api/report/${reportId}/update`, {
            method: "PUT",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "removed" }),
        })
        expect(removedResponse.status, "report removal status stage").toBe(200)
        const removedReports = await removedResponse.json() as Array<{ status: string }>
        expect(removedReports).toHaveLength(1)
        expect(removedReports[0]!.status).toBe("removed")

        const topicUpdateResponse = await fetch(`/api/topic/${topicId}/reports/${reportId}/update`, {
            method: "PUT",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "resolved", resolution: "Topic report reviewed." }),
        })
        expect(topicUpdateResponse.status, "topic report update stage").toBe(200)
        expect(await getModeratorLogs(`report:${reportId}`)).toHaveLength(4)

        const reopenedResponse = await fetch("/api/report/send", {
            method: "POST",
            headers: {
                Authorization: reporter.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ subject: thread.id, reason: "New evidence after the decision." }),
        })
        expect(reopenedResponse.status, "new complaint does not reopen stage").toBe(204)
        const reopenedReportsResponse = await fetch("/api/report", {
            headers: { Authorization: admin.accessToken },
        })
        expect(reopenedReportsResponse.status, "report after later complaint stage").toBe(200)
        const reopenedReports = await reopenedReportsResponse.json() as Array<{
            id: string
            subject: { id: string }
            status: string
            resolution?: string
            moderator?: { id: string }
            complaints: Array<{ reason: string }>
        }>
        const reportAfterComplaint = reopenedReports.find(item => item.subject.id === thread.id)
        if (!reportAfterComplaint) throw new Error("Report should remain in the admin queue.")
        expect(extractId(reportAfterComplaint.id)).toBe(reportId)
        expect(reportAfterComplaint.status).toBe("resolved")
        expect(reportAfterComplaint.resolution).toBe("Topic report reviewed.")
        expect(reportAfterComplaint.moderator?.id).toBe(admin.user.id)
        expect(reportAfterComplaint.complaints).toHaveLength(4)
        expect(await getModeratorLogs(`report:${reportId}`)).toHaveLength(4)
    }
    finally {
        await removeRecords([
            ...(reportId ? [`DELETE moderatorLog WHERE target = report:${reportId};`] : []),
            ...(reportId ? [`DELETE report:${reportId};`] : []),
            ...(threadId ? [`DELETE thread:${threadId};`] : []),
            `DELETE topic:${topicId};`,
        ])
    }
})

it("shares the report rate limit across report submission routes", async () => {
    const headers = { "X-Forwarded-For": "198.51.100.42" }
    for (let attempt = 0; attempt < 5; attempt++) {
        const response = await fetch("/api/report/send", { method: "POST", headers })
        expect(response.status).toBe(401)
    }

    const reportQueueResponse = await fetch("/api/report", {
        headers: { Authorization: admin.accessToken },
    })
    expect(reportQueueResponse.status, "report queue reads do not consume submission quota").toBe(200)

    const limitedSubmission = await fetch("/api/report/send", { method: "POST", headers })
    expect(limitedSubmission.status, "sixth report submission is rate limited").toBe(429)

    const limitedResponse = await fetch("/api/post/missing/report", { method: "POST", headers })
    expect(limitedResponse.status).toBe(429)
})