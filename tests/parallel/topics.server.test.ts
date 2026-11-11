import { expect, it } from "vitest"
import { expectStatus, grabExampleServer, grabUser } from "../utils/test-server"
import { extractId } from "../../shared/utils/records"
import type { Comment, ModeratorLog, Post, Thread, Topic } from "../../shared/types"

const admin = await grabUser("admin")
const member = (await grabExampleServer("default")).users.sampleUser01

it("creates and traverses a referenced topic, then removes it when its post is deleted", async () => {
    const topicId = `topicReference${Date.now()}`
    const otherTopicId = `topicReferenceOther${Date.now()}`
    let postId: string | undefined
    let otherPostId: string | undefined

    try {
        const response = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: {
                title: `Topic reference ${Date.now()}`,
                content: "Created by the topic reference integration test.",
                topics: [`topic:${topicId}`],
                images: [],
            },
        })
        expectStatus(response, 200, "post creation stage")
        const post = response._data!
        postId = extractId(post.id)
        expect(postId).toBeDefined()

        const topicPosts = await admin.query<Array<Array<string[]>>>(`SELECT VALUE posts FROM topic:${topicId};`)
        expect(topicPosts[0]?.[0]).toContain(post.id)

        const createdTopic = await admin.fetch<Topic>(`/api/topic/${topicId}`)
        expect(createdTopic.status).toBe("active")
        expect(createdTopic.moderation).toEqual({
            maxPostInterval: 60,
            priorityReportThreshold: 5,
        })

        const adminProfileResponse = await admin.fetchRaw<Topic>(`/api/topic/${topicId}/profile`, { method: "GET" })
        expectStatus(adminProfileResponse, 200, "authorized topic profile stage")
        const memberProfileResponse = await member.fetchRaw(`/api/topic/${topicId}/profile`, { method: "GET" })
        expectStatus(memberProfileResponse, 403, "unauthorized topic profile stage")

        const blockedThreadResponse = await admin.fetchRaw("/api/thread/add", {
            method: "POST",
            body: {
                content: "Attempted during the topic cooldown.",
                topics: [`topic:${topicId}`],
                images: [],
            },
        })
        expectStatus(blockedThreadResponse, 429, "topic posting interval stage")

        const otherPostResponse = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: {
                title: "A different topic remains available",
                content: "A recent post in another topic must not block this one.",
                topics: [`topic:${otherTopicId}`],
                images: [],
            },
        })
        expectStatus(otherPostResponse, 200, "independent topic posting stage")
        otherPostId = extractId(otherPostResponse._data!.id)

        const updatedDefaults = {
            maxPostInterval: 120,
            priorityReportThreshold: 3,
        }
        const updateResponse = await admin.fetchRaw(`/api/topic/${topicId}/update`, {
            method: "POST",
            body: {
                description: "Topic settings test",
                moderation: updatedDefaults,
            },
        })
        expectStatus(updateResponse, 200, "topic defaults update stage")
        const updatedTopic = await admin.fetch<Topic>(`/api/topic/${topicId}`)
        expect(updatedTopic.moderation).toEqual(updatedDefaults)

        const invalidUpdateResponse = await admin.fetchRaw(`/api/topic/${topicId}/update`, {
            method: "POST",
            body: {
                description: "Invalid topic settings test",
                moderation: {
                    ...updatedDefaults,
                    priorityReportThreshold: 0,
                },
            },
        })
        expectStatus(invalidUpdateResponse, 400, "topic defaults validation stage")
        const unchangedTopic = await admin.fetch<Topic>(`/api/topic/${topicId}`)
        expect(unchangedTopic.moderation).toEqual(updatedDefaults)

        await admin.query(`UPDATE topic:${topicId} SET status = "locked";`)
        const lockedTopic = await admin.fetch<Topic>(`/api/topic/${topicId}`)
        expect(lockedTopic.status).toBe("locked")

        const deleteResponse = await admin.fetchRaw(`/api/post/${postId}/delete`)
        expectStatus(deleteResponse, 200, "post deletion stage")

        const remainingTopics = await admin.query<Array<Array<string>>>(`SELECT VALUE id FROM topic WHERE id = topic:${topicId};`)
        expect(remainingTopics[0]).toHaveLength(0)
    }
    finally {
        await admin.query([
            ...(postId ? [`DELETE post:${postId};`] : []),
            ...(otherPostId ? [`DELETE post:${otherPostId};`] : []),
            `DELETE topic:${topicId};`,
            `DELETE topic:${otherTopicId};`,
        ].join("\n"))
    }
})

it("allows only admins to lock and unlock topics without restricting existing discussions", async () => {
    const topicId = `topicLock${Date.now()}`
    const imageId = `topicLockImage${Date.now()}`
    let postId: string | undefined
    let threadId: string | undefined
    let commentId: string | undefined
    let replyId: string | undefined

    try {
        const postResponse = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: {
                title: `Topic lock ${Date.now()}`,
                content: "Existing content remains usable after its topic is locked.",
                topics: [`topic:${topicId}`],
                images: [],
            },
        })
        expectStatus(postResponse, 200, "topic lock fixture post stage")
        postId = extractId(postResponse._data!.id)

        await admin.query(`UPDATE topic:${topicId} SET moderation = { maxPostInterval: 0, priorityReportThreshold: 5 };`)
        const threadResponse = await admin.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: {
                content: "Existing thread remains usable after its topic is locked.",
                topics: [`topic:${topicId}`],
                images: [],
            },
        })
        expectStatus(threadResponse, 200, "topic lock fixture thread stage")
        threadId = extractId(threadResponse._data!.id)

        await admin.query(`CREATE ONLY image:${imageId} SET user = ${admin.user.id}, type = "jpeg", origin = "https://example.invalid", tokens = 0;`)

        expectStatus(await member.fetchRaw(`/api/topic/${topicId}/lock`, { method: "POST" }), 403, "non-admin lock authorization stage")
        expectStatus(await member.fetchRaw(`/api/topic/${topicId}/unlock`, { method: "POST" }), 403, "non-admin unlock authorization stage")

        const lockResponse = await admin.fetchRaw<{ topic: string, status: string }>(`/api/topic/${topicId}/lock`, { method: "POST" })
        expectStatus(lockResponse, 200, "topic lock stage")
        expect(lockResponse._data).toMatchObject({ topic: `topic:${topicId}`, status: "locked" })
        expect((await admin.fetch<Topic>(`/api/topic/${topicId}`)).status).toBe("locked")

        const availableWhileLocked = await admin.fetch<Array<Pick<Topic, "id" | "score">>>("/api/topic/available")
        expect(availableWhileLocked.some(topic => topic.id === `topic:${topicId}`)).toBe(false)

        expectStatus(await admin.fetchRaw(`/api/topic/${topicId}/lock`, { method: "POST" }), 409, "duplicate topic lock stage")
        expectStatus(await admin.fetchRaw("/api/post/add", {
            method: "POST",
            body: {
                title: `Locked topic post ${Date.now()}`,
                content: "This new content must not use a locked topic.",
                topics: [`topic:${topicId}`],
                images: [],
            },
        }), 409, "locked topic post assignment stage")
        expectStatus(await admin.fetchRaw("/api/thread/add", {
            method: "POST",
            body: {
                content: "This new thread must not use a locked topic.",
                topics: [`topic:${topicId}`],
                images: [],
            },
        }), 409, "locked topic thread assignment stage")
        expectStatus(await admin.fetchRaw("/api/gallery/publish", {
            method: "POST",
            body: {
                images: [`image:${imageId}`],
                description: "This new gallery must not use a locked topic.",
                topics: [`topic:${topicId}`],
            },
        }), 409, "locked topic gallery assignment stage")

        const commentResponse = await member.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: {
                context: `post:${postId}`,
                replyTo: `post:${postId}`,
                content: `Comment on existing content ${Date.now()}`,
            },
        })
        expectStatus(commentResponse, 200, "existing post discussion stage")
        commentId = extractId(commentResponse._data!.id)

        const replyResponse = await member.fetchRaw<Thread>(`/api/thread/${threadId}/reply`, {
            method: "POST",
            body: { content: `Reply to existing thread ${Date.now()}` },
        })
        expectStatus(replyResponse, 200, "existing thread discussion stage")
        replyId = extractId(replyResponse._data!.id)

        const itemLocks = await admin.query<Array<Array<string>>>(`
            SELECT VALUE id
            FROM moderation
            WHERE subject IN [post:${postId}, thread:${threadId}];
        `)
        expect(itemLocks[0]).toHaveLength(0)

        const unlockResponse = await admin.fetchRaw<{ topic: string, status: string }>(`/api/topic/${topicId}/unlock`, { method: "POST" })
        expectStatus(unlockResponse, 200, "topic unlock stage")
        expect(unlockResponse._data).toMatchObject({ topic: `topic:${topicId}`, status: "active" })
        expect((await admin.fetch<Topic>(`/api/topic/${topicId}`)).status).toBe("active")
        expectStatus(await admin.fetchRaw(`/api/topic/${topicId}/unlock`, { method: "POST" }), 409, "duplicate topic unlock stage")

        const availableAfterUnlock = await admin.fetch<Array<Pick<Topic, "id" | "score">>>("/api/topic/available")
        expect(availableAfterUnlock.some(topic => topic.id === `topic:${topicId}`)).toBe(true)

        const logs = await admin.query<ModeratorLog[][]>(`
            SELECT actor, action, target, details
            FROM moderatorLog
            WHERE target = topic:${topicId};
        `)
        expect(logs[0]).toHaveLength(2)
        expect(logs[0]).toEqual(expect.arrayContaining([
            expect.objectContaining({
                actor: admin.user.id,
                action: "moderation.topic.locked",
                target: `topic:${topicId}`,
                details: { status: { before: "active", after: "locked" } },
            }),
            expect.objectContaining({
                actor: admin.user.id,
                action: "moderation.topic.unlocked",
                target: `topic:${topicId}`,
                details: { status: { before: "locked", after: "active" } },
            }),
        ]))
    }
    finally {
        const notificationContexts = [
            ...(postId ? [`post:${postId}`] : []),
            ...(replyId ? [`thread:${replyId}`] : []),
        ]
        await admin.query([
            ...(notificationContexts.length ? [`DELETE notification WHERE context IN [${notificationContexts.join(", ")}];`] : []),
            `DELETE moderatorLog WHERE target = topic:${topicId};`,
            ...(commentId ? [`DELETE comment:${commentId};`] : []),
            ...(replyId ? [`DELETE thread:${replyId};`] : []),
            ...(threadId ? [`DELETE thread:${threadId};`] : []),
            ...(postId ? [`DELETE post:${postId};`] : []),
            `DELETE gallery WHERE images CONTAINS image:${imageId};`,
            `DELETE image:${imageId};`,
            `DELETE topic:${topicId};`,
        ].join("\n"))
    }
})