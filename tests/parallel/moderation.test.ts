import { expect, it } from "vitest"
import type { Topic, User } from "../../shared/types"
import { fetch, grabExampleServer, grabUser } from "../test-server"

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
    const response = await fetch("/api/developer/database/query", {
        method: "POST",
        headers: {
            Authorization: admin.accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query: `
                CREATE ONLY topic:${topicId} SET posts = [], threads = [];
                CREATE ONLY moderationRequest:${requestId} SET
                    topic = topic:${topicId},
                    user = ${member.user.id};
            `,
        }),
    })
    expect(response.status, await response.clone().text()).toBe(200)
    return { topicId, requestId }
}

async function removeModerationRequests(items: Array<{ topicId: string, requestId: string }>) {
    if (items.length === 0) return

    const statements = items.flatMap(({ topicId, requestId }) => [
        `DELETE moderationRequest:${requestId};`,
        `DELETE topic:${topicId};`,
    ])
    const response = await fetch("/api/developer/database/query", {
        method: "POST",
        headers: {
            Authorization: admin.accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: statements.join("\n") }),
    })
    expect(response.status, await response.clone().text()).toBe(200)
}

async function getModerationRequest(requestId: string) {
    const response = await fetch("/api/moderator/request", {
        headers: { Authorization: admin.accessToken },
    })
    expect(response.status).toBe(200)
    const requests = await response.json() as ModerationRequest[]
    return requests.find(request => request.id === `moderationRequest:${requestId}`)
}

it("restricts moderation requests to moderators", async () => {
    const listResponse = await fetch("/api/moderator/request", {
        headers: { Authorization: member.accessToken },
    })
    expect(listResponse.status).toBe(403)

    const approvalResponse = await fetch("/api/moderator/request/missing/approve", {
        method: "POST",
        headers: { Authorization: member.accessToken },
    })
    expect(approvalResponse.status).toBe(403)
})

it("records approvals and rejects duplicate approvals", async () => {
    const testRequest = await createModerationRequest(`Approval${Date.now()}`)

    try {
        const approve = () => fetch(`/api/moderator/request/${testRequest.requestId}/approve`, {
            method: "POST",
            headers: { Authorization: admin.accessToken },
        })
        expect((await approve()).status).toBe(200)
        expect((await approve()).status).toBe(409)

        const request = await getModerationRequest(testRequest.requestId)
        expect(request?.approvals).toContain(admin.user.id)
        expect(request?.denials).toEqual([])
        expect(request?.closed).toBe(false)
    }
    finally {
        await removeModerationRequests([testRequest])
    }
})

it("records denials and rejects duplicate denials", async () => {
    const testRequest = await createModerationRequest(`Denial${Date.now()}`)

    try {
        const deny = () => fetch(`/api/moderator/request/${testRequest.requestId}/deny`, {
            method: "POST",
            headers: { Authorization: admin.accessToken },
        })
        expect((await deny()).status).toBe(200)
        expect((await deny()).status).toBe(409)

        const request = await getModerationRequest(testRequest.requestId)
        expect(request?.approvals).toEqual([])
        expect(request?.denials).toContain(admin.user.id)
        expect(request?.closed).toBe(false)
    }
    finally {
        await removeModerationRequests([testRequest])
    }
})