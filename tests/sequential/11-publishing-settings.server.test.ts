import { expect, it } from "vitest"
import type { AppSettings, Post, Thread } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { expectStatus, grabExampleServer, grabUser } from "../utils/test-server"

const admin = await grabUser("admin")

it("enforces post and thread publishing settings and topic submission rules", async () => {
    const originalSettings = await admin.fetch<AppSettings>("/api/settings/default")
    const settingsPath = `/api/admin/settings/${extractId(originalSettings.id)}/update`
    const marker = Date.now().toString(36)
    const allowedPostTopic = `topic:publishAllowedPost${marker}`
    const allowedThreadTopic = `topic:publishAllowedThread${marker}`
    const disallowedTopic = `topic:publishDisallowed${marker}`
    const postIds: string[] = []
    const threadIds: string[] = []
    const rejectedPostTitles = [
        `Disabled post ${marker}`,
        `Over-limit post ${marker}`,
        `Disallowed-topic post ${marker}`,
        `Zero-limit post ${marker}`,
    ]
    const rejectedThreadContents = [
        `Disabled thread ${marker}`,
        `Over-limit thread ${marker}`,
        `Disallowed-topic thread ${marker}`,
    ]

    const updateSettings = (settings: AppSettings) => admin.fetchRaw(settingsPath, {
        method: "POST",
        body: settings,
    })
    const postRequest = (title: string, topics: string[]) => admin.fetchRaw<Post>("/api/post/add", {
        method: "POST",
        body: { title, content: "Publishing settings test.", topics, images: [] },
    })
    const threadRequest = (content: string, topics: string[]) => admin.fetchRaw<Thread>("/api/thread/add", {
        method: "POST",
        body: { content, topics, images: [] },
    })

    try {
        await admin.query(`
            CREATE ONLY ${allowedPostTopic} SET posts = [], threads = [];
            CREATE ONLY ${allowedThreadTopic} SET posts = [], threads = [];
            CREATE ONLY ${disallowedTopic} SET posts = [], threads = [];
        `)

        expectStatus(await updateSettings({
            ...originalSettings,
            posts: { ...originalSettings.posts, enabled: false },
            threads: { ...originalSettings.threads, enabled: false },
        }), 200, "disable post and thread publishing")
        expectStatus(await postRequest(rejectedPostTitles[0], []), 403, "reject disabled post publishing")
        expectStatus(await threadRequest(rejectedThreadContents[0], []), 403, "reject disabled thread publishing")

        const topicSettings: AppSettings = {
            ...originalSettings,
            posts: { ...originalSettings.posts, enabled: true },
            threads: { ...originalSettings.threads, enabled: true },
            topics: {
                ...originalSettings.topics,
                perSubmission: 1,
                restrict: true,
                allowed: [allowedPostTopic, allowedThreadTopic],
            },
        }
        expectStatus(await updateSettings(topicSettings), 200, "enable publishing with restricted topics")

        const allowedPostResponse = await postRequest(`Allowed post ${marker}`, [allowedPostTopic])
        expectStatus(allowedPostResponse, 200, "allow a post within the topic limit")
        postIds.push(extractId(allowedPostResponse._data!.id)!)

        const allowedThreadResponse = await threadRequest(`Allowed thread ${marker}`, [allowedThreadTopic])
        expectStatus(allowedThreadResponse, 200, "allow a thread within the topic limit")
        threadIds.push(extractId(allowedThreadResponse._data!.id)!)

        expectStatus(await postRequest(rejectedPostTitles[1], [allowedPostTopic, allowedThreadTopic]), 400, "reject an over-limit post")
        expectStatus(await threadRequest(rejectedThreadContents[1], [allowedPostTopic, allowedThreadTopic]), 400, "reject an over-limit thread")
        expectStatus(await postRequest(rejectedPostTitles[2], [disallowedTopic]), 403, "reject a post with a disallowed topic")
        expectStatus(await threadRequest(rejectedThreadContents[2], [disallowedTopic]), 403, "reject a thread with a disallowed topic")

        const zeroTopicLimit = await updateSettings({
            ...topicSettings,
            topics: { ...topicSettings.topics, perSubmission: 0 },
        })
        expectStatus(zeroTopicLimit, 400, "reject a zero topic limit")
        await admin.query("UPDATE appSettings:default SET topics.perSubmission = 0;")
        expectStatus(await postRequest(rejectedPostTitles[3], [allowedPostTopic]), 400, "treat a stored zero topic limit as no topic assignments")
        await admin.query("UPDATE appSettings:default SET topics.perSubmission = 1;")
        expect((await admin.fetch<AppSettings>("/api/settings/default")).topics.perSubmission).toBe(1)

        const rejectedPosts = await admin.query<Array<Array<{ id: string }>>>(
            `SELECT id FROM post WHERE title IN [${rejectedPostTitles.map(title => JSON.stringify(title)).join(", ")}];`,
        )
        const rejectedThreads = await admin.query<Array<Array<{ id: string }>>>(
            `SELECT id FROM thread WHERE content IN [${rejectedThreadContents.map(content => JSON.stringify(content)).join(", ")}];`,
        )
        expect(rejectedPosts[0] ?? []).toHaveLength(0)
        expect(rejectedThreads[0] ?? []).toHaveLength(0)
    }
    finally {
        try {
            expectStatus(await updateSettings(originalSettings), 200, "restore application settings")
        }
        finally {
            await admin.query([
                ...postIds.map(id => `DELETE post:${id};`),
                ...threadIds.map(id => `DELETE thread:${id};`),
                `DELETE ${allowedPostTopic};`,
                `DELETE ${allowedThreadTopic};`,
                `DELETE ${disallowedTopic};`,
            ].join("\n"))
        }
    }
})

it("gates new moderator requests without limiting approvals already in progress", async () => {
    const originalSettings = await admin.fetch<AppSettings>("/api/settings/default")
    const settingsPath = `/api/admin/settings/${extractId(originalSettings.id)}/update`
    const member = (await grabExampleServer("default")).users.sampleUser03
    const memberWasModerator = member.user.roles.includes("moderator")
    const memberWasConfirmed = member.user.traits.includes("confirmed")
    const marker = Date.now().toString(36)
    const fullTopicId = `moderatorFull${marker}`
    const manualTopicId = `moderatorManual${marker}`
    const automaticTopicId = `moderatorAutomatic${marker}`
    const topicIds = [fullTopicId, manualTopicId, automaticTopicId]
    const updateSettings = (settings: AppSettings) => admin.fetchRaw(settingsPath, {
        method: "POST",
        body: settings,
    })

    async function getRequestId(topicId: string) {
        const requests = await admin.query<Array<Array<{ id: string }>>>(
            `SELECT id FROM moderationRequest WHERE topic = topic:${topicId};`,
        )
        const id = requests[0]?.[0]?.id
        if (!id) throw new Error(`No moderation request exists for topic:${topicId}.`)
        return id
    }

    async function getModerators(topicId: string) {
        const topics = await admin.query<Array<Array<{ moderators: string[] }>>>(
            `SELECT moderators FROM topic WHERE id = topic:${topicId} LIMIT 1;`,
        )
        return topics[0]?.[0]?.moderators ?? []
    }

    try {
        expectStatus(await updateSettings({
            ...originalSettings,
            moderation: { ...originalSettings.moderation, perTopic: 1, threshold: 1 },
        }), 200, "set moderator request threshold")
        if (!memberWasConfirmed) {
            await admin.query(`UPDATE ${member.user.id} SET traits = array::union(traits, ["confirmed"]);`)
        }

        await admin.query(`
            CREATE ONLY topic:${fullTopicId} SET posts = [], threads = [], moderators = [${admin.user.id}];
            CREATE ONLY topic:${manualTopicId} SET posts = [], threads = [], moderators = [];
            CREATE ONLY topic:${automaticTopicId} SET posts = [], threads = [], moderators = [];
        `)

        expectStatus(await member.fetchRaw(`/api/topic/${fullTopicId}/request-moderation`, { method: "POST" }), 409)
        const rejectedRequests = await admin.query<Array<Array<{ id: string }>>>(
            `SELECT id FROM moderationRequest WHERE topic = topic:${fullTopicId};`,
        )
        expect(rejectedRequests[0] ?? []).toHaveLength(0)

        expectStatus(await member.fetchRaw(`/api/topic/${manualTopicId}/request-moderation`, { method: "POST" }), 204)
        expectStatus(await member.fetchRaw(`/api/topic/${automaticTopicId}/request-moderation`, { method: "POST" }), 204)

        const manualRequestId = await getRequestId(manualTopicId)
        const automaticRequestId = await getRequestId(automaticTopicId)
        await admin.query(`UPDATE topic:${manualTopicId} SET moderators = [${admin.user.id}];`)
        await admin.query(`UPDATE topic:${automaticTopicId} SET moderators = [${admin.user.id}];`)
        await admin.query(`UPDATE ${automaticRequestId} SET approvals = [${admin.user.id}];`)

        const manualApproval = await admin.fetchRaw<{ approved: boolean }>(
            `/api/moderator/request/${extractId(manualRequestId)}/approve`,
            { method: "POST" },
        )
        expectStatus(manualApproval, 200, "approve a request after the request threshold is reached")
        expect(manualApproval._data?.approved).toBe(true)
        expect(await getModerators(manualTopicId)).toHaveLength(2)

        const requests = await admin.fetch<Array<{ id: string, closed: boolean }>>("/api/moderator/request")
        expect(requests.find(request => request.id === automaticRequestId)?.closed).toBe(true)
        expect(await getModerators(automaticTopicId)).toHaveLength(2)
    }
    finally {
        try {
            if (!memberWasModerator) {
                await admin.query(`UPDATE ${member.user.id} SET roles -= "moderator";`)
            }
            if (!memberWasConfirmed) {
                await admin.query(`UPDATE ${member.user.id} SET traits -= "confirmed";`)
            }

            const requests = await admin.query<Array<Array<{ id: string }>>>(
                `SELECT id FROM moderationRequest WHERE topic IN [${topicIds.map(id => `topic:${id}`).join(", ")}];`,
            )
            const requestRecords = requests[0] ?? []
            await admin.query([
                `DELETE notification WHERE context IN [${topicIds.map(id => `topic:${id}`).join(", ")}];`,
                ...requestRecords.map(request => `DELETE moderatorLog WHERE target = ${request.id};`),
                ...requestRecords.map(request => `DELETE ${request.id};`),
                ...topicIds.map(id => `DELETE topic:${id};`),
            ].join("\n"))
        }
        finally {
            expectStatus(await updateSettings(originalSettings), 200, "restore application settings")
        }
    }
})
