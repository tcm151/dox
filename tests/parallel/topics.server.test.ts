import { expect, it } from "vitest"
import { expectStatus, fetch, grabExampleServer, grabUser } from "../utils/test-server"
import { extractId } from "../../shared/utils/records"
import type { Comment, ModeratorLog, Pin, Post, Thread, Topic } from "../../shared/types"

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
                rules: "Be kind and stay on topic.",
            },
        })
        expectStatus(updateResponse, 200)
        const updatedTopic = await admin.fetch<Topic>(`/api/topic/${topicId}`)
        expect(updatedTopic.moderation).toEqual(updatedDefaults)
        expect(updatedTopic.rules).toBe("Be kind and stay on topic.")

        const invalidUpdateResponse = await admin.fetchRaw(`/api/topic/${topicId}/update`, {
            method: "POST",
            body: {
                description: "Invalid topic settings test",
                moderation: {
                    ...updatedDefaults,
                    priorityReportThreshold: 0,
                },
                rules: "Invalid update should not persist.",
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

it("lets topic moderators manage the active state of topic-scoped pins", async () => {
    const topicId = `topicPins${Date.now()}`
    let postId: string | undefined
    let pinId: string | undefined
    let moderatorId: string | undefined
    let moderatorToken: string | undefined

    try {
        const postResponse = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: {
                title: `Topic pin ${Date.now()}`,
                content: "Topic pin management test.",
                topics: [`topic:${topicId}`],
                images: [],
            },
        })
        expectStatus(postResponse, 200, "topic pin content stage")
        postId = extractId(postResponse._data!.id)

        const moderatorName = `TopicPinModerator${Date.now()}`
        const registerResponse = await fetch("/api/user/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: moderatorName,
                email: `${moderatorName.toLowerCase()}@example.invalid`,
                password: "TopicPinModerator-test-password",
            }),
        })
        expectStatus(registerResponse, 200, "topic moderator registration stage")
        moderatorToken = await registerResponse.text()

        const profileResponse = await fetch("/api/profile/authenticate", {
            headers: { Authorization: moderatorToken },
        })
        expectStatus(profileResponse, 200, "topic moderator authentication stage")
        moderatorId = (await profileResponse.json() as { id: string }).id
        await admin.query(`
            UPDATE ${moderatorId} SET roles = ["moderator"];
            UPDATE topic:${topicId} SET moderators += ${moderatorId};
        `)

        const addResponse = await fetch(`/api/topic/${topicId}/pins/add`, {
            method: "POST",
            headers: { Authorization: moderatorToken, "Content-Type": "application/json" },
            body: JSON.stringify({ item: postResponse._data!.id }),
        })
        expectStatus(addResponse, 200, "topic pin creation stage")

        const managedResponse = await fetch(`/api/topic/${topicId}/pins/manage`, {
            headers: { Authorization: moderatorToken },
        })
        expectStatus(managedResponse, 200, "topic pin management stage")
        const managedPins = await managedResponse.json() as Pin[]
        expect(managedPins).toHaveLength(1)
        pinId = extractId(managedPins[0].id)
        expect(managedPins[0]).toMatchObject({ scope: "topic", active: true })
        expect(managedPins[0].topic).toMatchObject({ id: `topic:${topicId}` })

        expectStatus(await member.fetchRaw(`/api/topic/${topicId}/pins/manage`), 403, "topic pin management authorization stage")

        const updateResponse = await fetch(`/api/topic/${topicId}/pins/${pinId}/update`, {
            method: "POST",
            headers: { Authorization: moderatorToken, "Content-Type": "application/json" },
            body: JSON.stringify({ active: false }),
        })
        expectStatus(updateResponse, 200, "topic pin active toggle stage")
        expect(await updateResponse.json()).toBe(false)

        const inactiveResponse = await fetch(`/api/topic/${topicId}/pins/manage`, {
            headers: { Authorization: moderatorToken },
        })
        expectStatus(inactiveResponse, 200, "inactive topic pin management stage")
        const inactivePins = await inactiveResponse.json() as Pin[]
        expect(inactivePins).toHaveLength(1)
        expect(inactivePins[0].active).toBe(false)
        expect(await admin.fetch<Pin[]>(`/api/topic/${topicId}/pins`)).toHaveLength(0)

        const deleteResponse = await fetch(`/api/topic/${topicId}/pins/${pinId}/delete`, {
            method: "POST",
            headers: { Authorization: moderatorToken },
        })
        expectStatus(deleteResponse, 200, "topic pin removal stage")
        const remainingPinsResponse = await fetch(`/api/topic/${topicId}/pins/manage`, {
            headers: { Authorization: moderatorToken },
        })
        expectStatus(remainingPinsResponse, 200, "topic pin removal verification stage")
        expect(await remainingPinsResponse.json()).toHaveLength(0)
    }
    finally {
        await admin.query([
            `DELETE pin WHERE topic = topic:${topicId};`,
            ...(postId ? [`DELETE post:${postId};`] : []),
            `DELETE topic:${topicId};`,
            ...(moderatorToken ? [`DELETE session WHERE id = ${moderatorToken};`] : []),
            ...(moderatorId ? [
                `DELETE userSettings WHERE user = ${moderatorId};`,
                `DELETE account WHERE user = ${moderatorId};`,
                `DELETE ${moderatorId};`,
            ] : []),
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

it("allows only admins to remove topic moderators and revokes the global role after the final assignment", async () => {
    const suffix = Date.now().toString()
    const topicId = `topicModerator${suffix}`
    const otherTopicId = `topicModeratorOther${suffix}`
    const moderatorId = `topicModeratorTarget${suffix}`
    const moderatorName = `TopicModTarget${suffix}`
    const actorId = `topicModeratorActor${suffix}`
    const actorName = `TopicModActor${suffix}`
    const accountId = `topicModeratorAccount${suffix}`
    const sessionId = `topicModeratorSession${suffix}`
    const actorToken = `session:${sessionId}`

    try {
        await admin.query(`
            CREATE ONLY user:${moderatorId} SET name = "${moderatorName}", roles = ["moderator"];
            CREATE ONLY user:${actorId} SET name = "${actorName}", roles = ["moderator"];
            CREATE ONLY topic:${topicId} SET moderators = [user:${moderatorId}, user:${actorId}];
            CREATE ONLY topic:${otherTopicId} SET moderators = [user:${moderatorId}];
            CREATE ONLY account:${accountId} SET
                user = user:${actorId},
                email = "${actorName}@example.invalid",
                password = "integration-test-password";
            CREATE ONLY session:${sessionId} SET account = account:${accountId};
        `)

        const moderatorRemoval = await fetch(`/api/topic/${topicId}/moderators/remove`, {
            method: "POST",
            headers: {
                Authorization: actorToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ user: `user:${moderatorId}` }),
        })
        expectStatus(moderatorRemoval, 403, "topic moderator cannot remove another moderator")
        const unchangedTopic = await admin.fetch<Topic>(`/api/topic/${topicId}/profile`)
        expect(unchangedTopic.moderators.some(user => user.id === `user:${moderatorId}`)).toBe(true)

        const firstRemoval = await admin.fetchRaw(`/api/topic/${topicId}/moderators/remove`, {
            method: "POST",
            body: { user: `user:${moderatorId}` },
        })
        expectStatus(firstRemoval, 200, "removal with another topic assignment")
        const rolesWithAnotherAssignment = await admin.query<string[][]>(`SELECT VALUE roles FROM ONLY user:${moderatorId};`)
        expect(rolesWithAnotherAssignment[0]).toContain("moderator")

        const finalRemoval = await admin.fetchRaw(`/api/topic/${otherTopicId}/moderators/remove`, {
            method: "POST",
            body: { user: `user:${moderatorId}` },
        })
        expectStatus(finalRemoval, 200, "removal of final topic assignment")
        const rolesWithoutAssignments = await admin.query<string[][]>(`SELECT VALUE roles FROM ONLY user:${moderatorId};`)
        expect(rolesWithoutAssignments[0]).not.toContain("moderator")

        const logs = await admin.query<ModeratorLog[][]>(`
            SELECT actor, action, target, details
            FROM moderatorLog
            WHERE target IN [topic:${topicId}, topic:${otherTopicId}];
        `)
        expect(logs[0]).toEqual(expect.arrayContaining([
            expect.objectContaining({
                actor: admin.user.id,
                action: "moderation.topic.moderator.removed",
                target: `topic:${topicId}`,
                details: { moderator: `user:${moderatorId}`, globalModeratorRoleRemoved: false },
            }),
            expect.objectContaining({
                actor: admin.user.id,
                action: "moderation.topic.moderator.removed",
                target: `topic:${otherTopicId}`,
                details: { moderator: `user:${moderatorId}`, globalModeratorRoleRemoved: true },
            }),
        ]))
    }
    finally {
        await admin.query(`
            DELETE moderatorLog WHERE target IN [topic:${topicId}, topic:${otherTopicId}];
            DELETE topic:${topicId};
            DELETE topic:${otherTopicId};
            DELETE session:${sessionId};
            DELETE account:${accountId};
            DELETE user:${actorId};
            DELETE user:${moderatorId};
        `)
    }
})