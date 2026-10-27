import { expect, it } from "vitest"
import { fetch, grabExampleServer, grabUser } from "../test-server"
import { extractId } from "../../shared/utils/records"
import type { Thread } from "../../shared/types"

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

it("rejects report submissions without authentication", async () => {
    const response = await fetch("/api/report/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: "thread:missing" }),
    })
    expect(response.status).toBe(401)
})

it("creates a report visible to administrators", async () => {
    const content = `Report test subject ${Date.now()}`
    let threadId: string | undefined
    let reportId: string | undefined

    try {
        const threadResponse = await fetch("/api/thread/add", {
            method: "POST",
            headers: {
                Authorization: threadAuthor.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content, topics: [], images: [] }),
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
        const resolvedReports = JSON.parse(resolutionResponseBody) as Array<{ resolution?: string, status: string }>
        expect(resolvedReports).toHaveLength(1)
        expect(resolvedReports[0]!.resolution).toBe("Reviewed and resolved.")
        expect(resolvedReports[0]!.status).toBe("resolved")

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

        const reopenedResponse = await fetch("/api/report/send", {
            method: "POST",
            headers: {
                Authorization: reporter.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ subject: thread.id, reason: "New evidence after the decision." }),
        })
        expect(reopenedResponse.status, "new complaint reopening stage").toBe(204)
        const reopenedReportsResponse = await fetch("/api/report", {
            headers: { Authorization: admin.accessToken },
        })
        expect(reopenedReportsResponse.status, "reopened report list stage").toBe(200)
        const reopenedReports = await reopenedReportsResponse.json() as Array<{
            id: string
            subject: { id: string }
            status: string
            resolution?: string
            complaints: Array<{ reason: string }>
        }>
        const reopened = reopenedReports.find(item => item.subject.id === thread.id)
        if (!reopened) throw new Error("Reopened report should remain in the admin queue.")
        expect(extractId(reopened.id)).toBe(reportId)
        expect(reopened.status).toBe("pending")
        expect(reopened.resolution).toBeUndefined()
        expect(reopened.complaints).toHaveLength(3)
    }
    finally {
        await removeRecords([
            ...(reportId ? [`DELETE report:${reportId};`] : []),
            ...(threadId ? [`DELETE thread:${threadId};`] : []),
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