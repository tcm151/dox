import { expect, it } from "vitest"
import type { AppSettings, ModeratorLog, Topic, User } from "../../shared/types"
import { expectStatus, fetch, grabExampleServer, grabUser } from "../test-server"

const admin = await grabUser("admin")
const exampleServer = await grabExampleServer("default")
const member = exampleServer.users.sampleUser03
type ModerationRequest = {
    id: string
    topic: Topic
    user: User
    approvals: string[]
    denials: string[]
    closed: boolean
}

async function createModerationRequest(suffix: string) {
    const topicId = `contractTopic${suffix}`
    const requestId = `contractRequest${suffix}`
    await admin.query(`
        CREATE ONLY topic:${topicId} SET posts = [], threads = [];
        CREATE ONLY moderationRequest:${requestId} SET
            topic = topic:${topicId},
            user = ${member.user.id};
    `)
    return { topicId, requestId }
}

async function removeModerationRequests(items: Array<{ topicId: string, requestId: string }>) {
    if (items.length === 0) return

    const statements = items.flatMap(({ topicId, requestId }) => [
        `DELETE notification WHERE context = topic:${topicId};`,
        `DELETE moderatorLog WHERE target = moderationRequest:${requestId};`,
        `DELETE moderationRequest:${requestId};`,
        `DELETE topic:${topicId};`,
    ])
    await admin.query(statements.join("\n"))
}

async function getModeratorLogs(requestId: string) {
    const results = await admin.query<ModeratorLog[][]>(`SELECT * FROM moderatorLog WHERE target = moderationRequest:${requestId};`)
    return results[0] ?? []
}

it("restricts moderation requests to moderators", async () => {
    const listResponse = await member.fetchRaw("/api/moderator/request")
    expectStatus(listResponse, 403)

    const approvalResponse = await member.fetchRaw("/api/moderator/request/missing/approve", { method: "POST" })
    expectStatus(approvalResponse, 403)
})

it("restricts the moderator log to administrators", async () => {
    const anonymousResponse = await fetch("/api/admin/logs/moderator")
    expectStatus(anonymousResponse, 401)

    const memberResponse = await member.fetchRaw("/api/admin/logs/moderator")
    expectStatus(memberResponse, 403)

    const logs = await admin.fetch<ModeratorLog[]>("/api/admin/logs/moderator")
    expect(Array.isArray(logs)).toBe(true)
    expect(logs.length).toBeLessThanOrEqual(100)
})

it("records approvals and rejects duplicate approvals", async () => {
    const testRequest = await createModerationRequest(`Approval${Date.now()}`)

    try {
        const approve = () => admin.fetchRaw(`/api/moderator/request/${testRequest.requestId}/approve`, { method: "POST" })
        expectStatus((await approve()), 200)
        expectStatus((await approve()), 409)

        const requests = await admin.fetch<ModerationRequest[]>("/api/moderator/request")
        const request = requests.find(item => item.id === `moderationRequest:${testRequest.requestId}`)
        expect(request?.approvals).toContain(admin.user.id)
        expect(request?.denials).toEqual([])
        expect(request?.closed).toBe(false)
        const logs = await getModeratorLogs(testRequest.requestId)
        expect(logs).toHaveLength(1)
        expect(logs[0]).toMatchObject({
            actor: admin.user.id,
            action: "moderation_request.approved",
            target: `moderationRequest:${testRequest.requestId}`,
            details: { topic: `topic:${testRequest.topicId}`, applicant: member.user.id },
        })
    }
    finally {
        await removeModerationRequests([testRequest])
    }
})

it("notifies the applicant when approved as a topic moderator", async () => {
    const testRequest = await createModerationRequest(`ApprovalNotice${Date.now()}`)
    const memberWasModerator = member.user.roles.includes("moderator")
    const settingsResponse = await fetch("/api/settings/default")
    expectStatus(settingsResponse, 200)
    const settings = await settingsResponse.json() as AppSettings
    const priorApprovals = Object.values(exampleServer.users)
        .map(session => session.user.id)
        .filter(userId => userId !== member.user.id)
        .slice(0, settings.moderation.threshold - 1)

    expect(priorApprovals).toHaveLength(settings.moderation.threshold - 1)

    try {
        await admin.query(`
            UPDATE moderationRequest:${testRequest.requestId} SET
                approvals = [${priorApprovals.join(", ")}];
        `)

        const response = await admin.fetchRaw(`/api/moderator/request/${testRequest.requestId}/approve`, { method: "POST" })
        expectStatus(response, 200)

        const notifications = await member.fetch<{ notifications: Array<{ context: string, message: string }> }>("/api/profile/notifications?dismissed=false&amount=100")
        const notification = notifications.notifications.find(item => item.context === `topic:${testRequest.topicId}`)
        expect(notification?.message).toContain("request to moderate this topic was approved")
    }
    finally {
        if (!memberWasModerator) {
            await admin.query(`UPDATE ${member.user.id} SET roles -= "moderator";`)
        }
        await removeModerationRequests([testRequest])
    }
})

it("reconciles existing approvals when their threshold is met", async () => {
    const testRequest = await createModerationRequest(`Reconcile${Date.now()}`)
    const memberWasModerator = member.user.roles.includes("moderator")
    const settingsResponse = await fetch("/api/settings/default")
    expectStatus(settingsResponse, 200)
    const settings = await settingsResponse.json() as AppSettings
    const approvalIds = [
        admin.user.id,
        ...Object.values(exampleServer.users).map(session => session.user.id),
    ]
        .filter(userId => userId !== member.user.id)
        .slice(0, settings.moderation.threshold)

    expect(approvalIds).toHaveLength(settings.moderation.threshold)

    try {
        await admin.query(`
            UPDATE moderationRequest:${testRequest.requestId} SET
                approvals = [${approvalIds.join(", ")}];
        `)

        const requests = await admin.fetch<ModerationRequest[]>("/api/moderator/request")
        const request = requests.find(item => item.id === `moderationRequest:${testRequest.requestId}`)
        expect(request?.closed).toBe(true)
        expect(request?.user.roles).toContain("moderator")

        const notifications = await member.fetch<{ notifications: Array<{ context: string, message: string }> }>("/api/profile/notifications?dismissed=false&amount=100")
        const notification = notifications.notifications.find(item => item.context === `topic:${testRequest.topicId}`)
        expect(notification?.message).toContain("request to moderate this topic was approved")
    }
    finally {
        if (!memberWasModerator) {
            await admin.query(`UPDATE ${member.user.id} SET roles -= "moderator";`)
        }
        await removeModerationRequests([testRequest])
    }
})

it("records denials and rejects duplicate denials", async () => {
    const testRequest = await createModerationRequest(`Denial${Date.now()}`)

    try {
        const deny = () => admin.fetchRaw(`/api/moderator/request/${testRequest.requestId}/deny`, { method: "POST" })
        expectStatus((await deny()), 200)
        expectStatus((await deny()), 409)

        const requests = await admin.fetch<ModerationRequest[]>("/api/moderator/request")
        const request = requests.find(item => item.id === `moderationRequest:${testRequest.requestId}`)
        expect(request?.approvals).toEqual([])
        expect(request?.denials).toContain(admin.user.id)
        expect(request?.closed).toBe(false)
        const logs = await getModeratorLogs(testRequest.requestId)
        expect(logs).toHaveLength(1)
        expect(logs[0]).toMatchObject({
            actor: admin.user.id,
            action: "moderation_request.denied",
            target: `moderationRequest:${testRequest.requestId}`,
            details: { topic: `topic:${testRequest.topicId}`, applicant: member.user.id },
        })
    }
    finally {
        await removeModerationRequests([testRequest])
    }
})