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
            body: JSON.stringify({ subject: thread.id }),
        })
        expect(reportResponse.status, "report submission stage").toBe(200)
        const report = await reportResponse.json() as { id: string, reporter: string, subject: string }
        reportId = extractId(report.id)
        expect(reportId).toBeDefined()
        expect(report.reporter).toBe(reporter.user.id)
        expect(report.subject).toBe(thread.id)

        const reportsResponse = await fetch("/api/report", {
            headers: { Authorization: admin.accessToken },
        })
        expect(reportsResponse.status, "admin report-list stage").toBe(200)
        const reports = await reportsResponse.json() as Array<{
            id: string
            reporter: { id: string }
            subject: { id: string }
        }>
        const listedReport = reports.find(item => item.id === report.id)
        expect(listedReport?.reporter.id).toBe(reporter.user.id)
        expect(listedReport?.subject.id).toBe(thread.id)
    }
    finally {
        await removeRecords([
            ...(reportId ? [`DELETE report:${reportId};`] : []),
            ...(threadId ? [`DELETE thread:${threadId};`] : []),
        ])
    }
})