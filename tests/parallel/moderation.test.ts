import { expect, it } from "vitest"
import type { AppSettings, Comment, ModeratorLog, Moderation, Post, Thread, Topic, User } from "../../shared/types"
import { expectStatus, fetch, grabExampleServer, grabUser } from "../test-server"
import { extractId } from "../../shared/utils/records"

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

async function getControlLogs(targets: string[]) {
    const results = await admin.query<ModeratorLog[][]>(`SELECT * FROM moderatorLog WHERE target IN [${targets.join(", ")}];`)
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

it("authorizes lock controls by topic and audits lock and unlock transitions", async () => {
    const topicId = `controlTopic${Date.now()}`
    const galleryId = `controlGallery${Date.now()}`
    const originalRoles = JSON.stringify(member.user.roles)
    let postId: string | undefined
    let commentId: string | undefined
    let threadId: string | undefined

    try {
        await admin.query(`CREATE ONLY topic:${topicId} SET moderators = [];`)
        const postResponse = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: {
                title: `Lock controls ${Date.now()}`,
                content: "Topic-scoped moderation control test.",
                topics: [`topic:${topicId}`],
                images: [],
            },
        })
        expectStatus(postResponse, 200, "post creation stage")
        const post = postResponse._data!
        postId = extractId(post.id)

        const commentResponse = await admin.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: { context: post.id, replyTo: post.id, content: `Control comment ${Date.now()}` },
        })
        expectStatus(commentResponse, 200, "comment creation stage")
        const comment = commentResponse._data!
        commentId = extractId(comment.id)

        await admin.query(`
            CREATE ONLY gallery:${galleryId} SET
                user = ${admin.user.id},
                description = "Lock control test.",
                topics = [topic:${topicId}],
                images = [],
                status = "archived";
        `)

        const noRoleResponse = await member.fetchRaw(`/api/moderation/post/${postId}/lock/apply`, {
            method: "POST",
            body: { scope: "item" },
        })
        expectStatus(noRoleResponse, 403, "role authorization stage")
        expectStatus(await member.fetchRaw(`/api/moderation/post/${postId}`), 403, "control state role authorization stage")

        await admin.query(`
            UPDATE ${member.user.id} SET roles += "moderator";
        `)

        const unassignedResponse = await member.fetchRaw(`/api/moderation/post/${postId}/lock/apply`, {
            method: "POST",
            body: { scope: "item" },
        })
        expectStatus(unassignedResponse, 403, "topic assignment stage")
        expectStatus(await member.fetchRaw(`/api/moderation/post/${postId}`), 403, "control state topic assignment stage")

        await admin.query(`UPDATE topic:${topicId} SET moderators += ${member.user.id};`)

        const setPostSlowMode = await member.fetchRaw<Pick<Moderation, "subject" | "slowed">>(`/api/moderation/post/${postId}/slow/apply`, {
            method: "POST",
            body: { interval: 60 },
        })
        expectStatus(setPostSlowMode, 200, "post slow-mode selection stage")
        expect(setPostSlowMode._data).toMatchObject({ subject: post.id, slowed: 60 })

        const unavailableSlowMode = await member.fetchRaw(`/api/moderation/post/${postId}/slow/apply`, {
            method: "POST",
            body: { interval: 45 },
        })
        expectStatus(unavailableSlowMode, 400, "admin-configured interval stage")

        const changeSlowMode = await member.fetchRaw(`/api/moderation/post/${postId}/slow/apply`, {
            method: "POST",
            body: { interval: 300 },
        })
        expectStatus(changeSlowMode, 409, "active slow-mode change stage")

        const missingScopeResponse = await member.fetchRaw(`/api/moderation/post/${postId}/lock/apply`, { method: "POST" })
        expectStatus(missingScopeResponse, 400, "missing scope stage")

        const invalidScopeResponse = await member.fetchRaw(`/api/moderation/comment/${commentId}/lock/apply`, {
            method: "POST",
            body: { scope: "chain" },
        })
        expectStatus(invalidScopeResponse, 400, "scope validation stage")

        const lockPostResponse = await member.fetchRaw<Pick<Moderation, "subject" | "locked">>(`/api/moderation/post/${postId}/lock/apply`, {
            method: "POST",
            body: { scope: "item" },
        })
        expectStatus(lockPostResponse, 200, "post lock stage")
        expect(lockPostResponse._data).toMatchObject({ subject: post.id, locked: "item" })

        const controlState = await member.fetch<Pick<Moderation, "locked" | "slowed">[]>(`/api/moderation/post/${postId}`)
        expect(controlState).toMatchObject([{ locked: "item", slowed: 60 }])
        expect(controlState).not.toHaveProperty("logs")

        const duplicateLockResponse = await member.fetchRaw(`/api/moderation/post/${postId}/lock/apply`, {
            method: "POST",
            body: { scope: "item" },
        })
        expectStatus(duplicateLockResponse, 409, "duplicate lock stage")

        const unlockPostResponse = await member.fetchRaw(`/api/moderation/post/${postId}/lock/clear`, { method: "POST" })
        expectStatus(unlockPostResponse, 200, "post unlock stage")
        const remainingPostControls = await admin.query<Moderation[][]>(`SELECT * FROM moderation WHERE subject = post:${postId};`)
        expect(remainingPostControls[0]?.[0]).toMatchObject({ subject: post.id, slowed: 60 })
        expect(remainingPostControls[0]?.[0]?.locked).toBeUndefined()

        expectStatus(await member.fetchRaw(`/api/moderation/post/${postId}/slow/clear`, { method: "POST" }), 200)
        const clearedPostControls = await admin.query<Moderation[][]>(`SELECT * FROM moderation WHERE subject = post:${postId};`)
        expect(clearedPostControls[0]).toHaveLength(0)

        const reappliedSlowMode = await member.fetchRaw<Pick<Moderation, "subject" | "slowed">>(`/api/moderation/post/${postId}/slow/apply`, {
            method: "POST",
            body: { interval: 300 },
        })
        expectStatus(reappliedSlowMode, 200, "slow-mode reapply after clear stage")
        expect(reappliedSlowMode._data).toMatchObject({ subject: post.id, slowed: 300 })
        expectStatus(await member.fetchRaw(`/api/moderation/post/${postId}/slow/clear`, { method: "POST" }), 200)
        const resetPostControls = await admin.query<Moderation[][]>(`SELECT * FROM moderation WHERE subject = post:${postId};`)
        expect(resetPostControls[0]).toHaveLength(0)

        const lockCommentResponse = await member.fetchRaw<Pick<Moderation, "subject" | "locked">>(`/api/moderation/comment/${commentId}/lock/apply`, {
            method: "POST",
            body: { scope: "item" },
        })
        expectStatus(lockCommentResponse, 200, "comment-context authorization stage")
        expect(lockCommentResponse._data).toMatchObject({ subject: comment.id, locked: "item" })
        expectStatus(await member.fetchRaw(`/api/moderation/comment/${commentId}/lock/clear`, { method: "POST" }), 200)

        const lockGalleryResponse = await member.fetchRaw<Pick<Moderation, "subject" | "locked">>(`/api/moderation/gallery/${galleryId}/lock/apply`, {
            method: "POST",
            body: { scope: "item" },
        })
        expectStatus(lockGalleryResponse, 200, "gallery topic authorization stage")
        expect(lockGalleryResponse._data).toMatchObject({ subject: `gallery:${galleryId}`, locked: "item" })
        expectStatus(await member.fetchRaw(`/api/moderation/gallery/${galleryId}/lock/clear`, { method: "POST" }), 200)

        const threadResponse = await admin.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content: `Global admin lock ${Date.now()}`, topics: [], images: [] },
        })
        expectStatus(threadResponse, 200, "thread creation stage")
        threadId = extractId(threadResponse._data!.id)
        const setThreadSlowMode = await admin.fetchRaw<Pick<Moderation, "subject" | "slowed">>(`/api/moderation/thread/${threadId}/slow/apply`, {
            method: "POST",
            body: { interval: 30 },
        })
        expectStatus(setThreadSlowMode, 200, "admin-global thread slow-mode stage")
        expect(setThreadSlowMode._data).toMatchObject({ subject: threadResponse._data!.id, slowed: 30 })

        const lockThreadResponse = await admin.fetchRaw<Pick<Moderation, "subject" | "locked">>(`/api/moderation/thread/${threadId}/lock/apply`, {
            method: "POST",
            body: { scope: "chain" },
        })
        expectStatus(lockThreadResponse, 200, "admin global lock stage")
        expect(lockThreadResponse._data).toMatchObject({ subject: threadResponse._data!.id, locked: "chain" })
        const lockedThread = await admin.fetch<Thread>(`/api/thread/${threadId}`)
        expect(lockedThread.moderation).toMatchObject({ locked: "chain", slowed: 30 })
        expectStatus(await admin.fetchRaw(`/api/moderation/thread/${threadId}/lock/clear`, { method: "POST" }), 200)
        expectStatus(await admin.fetchRaw(`/api/moderation/thread/${threadId}/slow/clear`, { method: "POST" }), 200)

        const targets = [post.id, comment.id, `gallery:${galleryId}`, threadResponse._data!.id]
        const logs = await getControlLogs(targets)
        expect(logs).toHaveLength(14)
        expect(logs).toEqual(expect.arrayContaining([
            expect.objectContaining({
                actor: member.user.id,
                action: "moderation.slow_mode.set",
                target: post.id,
                details: { slowMode: { before: "disabled", after: 60 } },
            }),
            expect.objectContaining({
                actor: member.user.id,
                action: "moderation.slow_mode.cleared",
                target: post.id,
                details: { slowMode: { before: 60, after: "disabled" } },
            }),
            expect.objectContaining({
                actor: member.user.id,
                action: "moderation.slow_mode.set",
                target: post.id,
                details: { slowMode: { before: "disabled", after: 300 } },
            }),
            expect.objectContaining({
                actor: member.user.id,
                action: "moderation.slow_mode.cleared",
                target: post.id,
                details: { slowMode: { before: 300, after: "disabled" } },
            }),
            expect.objectContaining({
                actor: member.user.id,
                action: "moderation.locked",
                target: post.id,
                details: { lock: { before: "unlocked", after: "item" } },
            }),
            expect.objectContaining({
                actor: member.user.id,
                action: "moderation.unlocked",
                target: post.id,
                details: { lock: { before: "item", after: "unlocked" } },
            }),
            expect.objectContaining({
                actor: member.user.id,
                action: "moderation.locked",
                target: comment.id,
                details: { lock: { before: "unlocked", after: "item" } },
            }),
            expect.objectContaining({
                actor: member.user.id,
                action: "moderation.unlocked",
                target: comment.id,
                details: { lock: { before: "item", after: "unlocked" } },
            }),
            expect.objectContaining({
                actor: member.user.id,
                action: "moderation.locked",
                target: `gallery:${galleryId}`,
                details: { lock: { before: "unlocked", after: "item" } },
            }),
            expect.objectContaining({
                actor: member.user.id,
                action: "moderation.unlocked",
                target: `gallery:${galleryId}`,
                details: { lock: { before: "item", after: "unlocked" } },
            }),
            expect.objectContaining({
                actor: admin.user.id,
                action: "moderation.locked",
                target: threadResponse._data!.id,
                details: { lock: { before: "unlocked", after: "chain" } },
            }),
            expect.objectContaining({
                actor: admin.user.id,
                action: "moderation.unlocked",
                target: threadResponse._data!.id,
                details: { lock: { before: "chain", after: "unlocked" } },
            }),
            expect.objectContaining({
                actor: admin.user.id,
                action: "moderation.slow_mode.set",
                target: threadResponse._data!.id,
                details: { slowMode: { before: "disabled", after: 30 } },
            }),
            expect.objectContaining({
                actor: admin.user.id,
                action: "moderation.slow_mode.cleared",
                target: threadResponse._data!.id,
                details: { slowMode: { before: 30, after: "disabled" } },
            }),
        ]))
    }
    finally {
        const contentSubjects = [
            ...(postId ? [`post:${postId}`] : []),
            ...(commentId ? [`comment:${commentId}`] : []),
            `gallery:${galleryId}`,
        ]
        const auditTargets = [
            ...contentSubjects,
            ...(threadId ? [`thread:${threadId}`] : []),
        ]
        await admin.query([
            `UPDATE ${member.user.id} SET roles = ${originalRoles};`,
            ...(auditTargets.length ? [`DELETE moderatorLog WHERE target IN [${auditTargets.join(", ")}];`] : []),
            ...(contentSubjects.length ? [`DELETE moderation WHERE subject IN [${contentSubjects.join(", ")}];`] : []),
            ...(threadId ? [`DELETE moderation WHERE subject = thread:${threadId};`, `DELETE thread:${threadId};`] : []),
            ...(commentId ? [`DELETE notification WHERE context = post:${postId};`, `DELETE comment:${commentId};`] : []),
            ...(postId ? [`DELETE post:${postId};`] : []),
            `DELETE gallery:${galleryId};`,
            `DELETE topic:${topicId};`,
        ].join("\n"))
    }
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
            action: "moderation.request.approved",
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
            action: "moderation.request.denied",
            target: `moderationRequest:${testRequest.requestId}`,
            details: { topic: `topic:${testRequest.topicId}`, applicant: member.user.id },
        })
    }
    finally {
        await removeModerationRequests([testRequest])
    }
})