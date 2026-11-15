import { expect, it } from "vitest"
import { expectStatus, fetch, grabExampleServer, grabUser, testAdminCredentials } from "../utils/test-server"
import { extractId } from "../../shared/utils/records"
import type { Comment, Gallery, Link, Notification, Post, User } from "../../shared/types"

const exampleServer = await grabExampleServer("default")
const awardSender = exampleServer.users.awardSender
const awardTarget = exampleServer.users.awardTarget
const subscriber = exampleServer.users.subscriber
const follower = exampleServer.users.sampleUser01
const followedUser = exampleServer.users.sampleUser02
const concurrentAwarder = exampleServer.users.sampleUser03
const concurrentTarget = exampleServer.users.sampleUser04
const insufficientAwarder = follower
const insufficientTarget = followedUser
const admin = await grabUser("admin")

type UserSummary = {
    name: string
    roles: string[]
}

async function restoreAwardState(sender: User, target: User, senderTokens: number, targetTokens: number) {
    const message = `**${sender.name}** awarded you 256 tokens. Don't forget to thank them!`
    await admin.query(`
        UPDATE ${sender.id} SET tokens = ${senderTokens};
        UPDATE ${target.id} SET tokens = ${targetTokens};
        IF ${target.id}.votes.awards CONTAINS ${sender.id} {
            UPDATE ${target.id} SET
                votes.awards = array::difference(votes.awards, [${sender.id}]);
        };
        DELETE notification WHERE recipient = ${target.id}
            AND context = ${target.id}
            AND message = "${message}";
    `)
}

it("lists users and returns the configured admin", async () => {
    const response = await fetch("/api/user")
    expectStatus(response, 200)

    const users = await response.json() as UserSummary[]
    const admin = users.find(user => user.name === testAdminCredentials.name)
    expect(admin).toBeDefined()
    expect(admin?.roles).toEqual(expect.arrayContaining(["admin", "moderator", "developer"]))
})

it("follows and unfollows a user with idempotent state updates", async () => {
    const followerId = extractId(follower.user.id)
    const followedUserId = extractId(followedUser.user.id)
    const follow = () => follower.fetchRaw(`/api/user/${followedUserId}/follow`, { method: "POST" })
    const unfollow = () => follower.fetchRaw(`/api/user/${followedUserId}/unfollow`, { method: "POST" })

    try {
        const unauthenticatedFollow = await fetch(`/api/user/${followedUserId}/follow`, { method: "POST" })
        expectStatus(unauthenticatedFollow, 401)

        expectStatus((await follow()), 200)
        expectStatus((await follow()), 200)

        const followerProfileResponse = await fetch(`/api/user/${followerId}`)
        expectStatus(followerProfileResponse, 200)
        const followerProfile = await followerProfileResponse.json() as User
        expect(followerProfile.following).toContain(followedUser.user.id)

        const followedProfileResponse = await fetch(`/api/user/${followedUserId}`)
        expectStatus(followedProfileResponse, 200)
        const followedProfile = await followedProfileResponse.json() as User
        expect(followedProfile.followers).toContain(follower.user.id)

        expectStatus((await unfollow()), 200)
        expectStatus((await unfollow()), 200)

        const unfollowedFollowerResponse = await fetch(`/api/user/${followerId}`)
        const unfollowedFollower = await unfollowedFollowerResponse.json() as User
        expect(unfollowedFollower.following).not.toContain(followedUser.user.id)

        const unfollowedProfileResponse = await fetch(`/api/user/${followedUserId}`)
        const unfollowedProfile = await unfollowedProfileResponse.json() as User
        expect(unfollowedProfile.followers).not.toContain(follower.user.id)
    }
    finally {
        await unfollow()
    }
})

it("awards users and saves or removes saved subscriptions", async () => {
    const awardTargetId = extractId(awardTarget.user.id)
    const subscriberId = extractId(subscriber.user.id)

    const unauthenticatedSave = await fetch(`/api/user/${awardTargetId}/save`, { method: "POST" })
    expectStatus(unauthenticatedSave, 401)

    const selfAward = await awardSender.fetchRaw(`/api/user/${extractId(awardSender.user.id)}/award`, { method: "POST" })
    expectStatus(selfAward, 400)

    const selfSave = await subscriber.fetchRaw(`/api/user/${subscriberId}/save`, { method: "POST" })
    expectStatus(selfSave, 400)

    const save = () => subscriber.fetchRaw(`/api/user/${awardTargetId}/save`, { method: "POST" })
    expectStatus((await save()), 200)
    expectStatus((await save()), 200)

    const savedProfileResponse = await fetch(`/api/user/${awardTargetId}`)
    expectStatus(savedProfileResponse, 200)
    const savedProfile = await savedProfileResponse.json() as User
    expect(savedProfile.votes.saves).toContain(subscriber.user.id)

    const unsave = () => subscriber.fetchRaw(`/api/user/${awardTargetId}/unsave`, { method: "POST" })
    expectStatus((await unsave()), 200)
    expectStatus((await unsave()), 200)

    const unsavedProfileResponse = await fetch(`/api/user/${awardTargetId}`)
    const unsavedProfile = await unsavedProfileResponse.json() as User
    expect(unsavedProfile.votes.saves).not.toContain(subscriber.user.id)

    const awarderBefore = await awardSender.fetch<User>("/api/profile/authenticate")
    const award = () => awardSender.fetchRaw(`/api/user/${awardTargetId}/award`, { method: "POST" })
    expectStatus((await award()), 200)
    expectStatus((await award()), 409)

    const awarderAfter = await awardSender.fetch<User>("/api/profile/authenticate")
    const awardedProfile = await awardTarget.fetch<User>("/api/profile/authenticate")
    const awardedPublicProfileResponse = await fetch(`/api/user/${awardTargetId}`)
    const awardedPublicProfile = await awardedPublicProfileResponse.json() as User
    expect(awarderAfter.tokens).toBe(awarderBefore.tokens - 256)
    expect(awardedProfile.tokens).toBe(awardTarget.user.tokens + 256)
    expect(awardedPublicProfile.votes.awards).toContain(awardSender.user.id)

    const notifications = await awardTarget.fetch<{ notifications: Notification[] }>("/api/profile/notifications?dismissed=false&amount=10")
    expect(notifications.notifications[0]?.context).toBe(awardTarget.user.id)
    expect(notifications.notifications[0]?.message).toContain("awarded you 256 tokens")
})

it("allows only one of two concurrent awards and records one notification", async () => {
    const senderBefore = await concurrentAwarder.fetch<User>("/api/profile/authenticate")
    const targetBefore = await concurrentTarget.fetch<User>("/api/profile/authenticate")
    const award = () => concurrentAwarder.fetchRaw(`/api/user/${extractId(concurrentTarget.user.id)}/award`, { method: "POST" })

    try {
        const responses = await Promise.all([award(), award()])
        const statuses = responses.map(response => response.status).sort()
        expect(statuses).toEqual([200, 409])

        const senderAfter = await concurrentAwarder.fetch<User>("/api/profile/authenticate")
        const targetAfter = await concurrentTarget.fetch<User>("/api/profile/authenticate")
        expect(senderAfter.tokens).toBe(senderBefore.tokens - 256)
        expect(targetAfter.tokens).toBe(targetBefore.tokens + 256)
        expect(targetAfter.votes.awards.filter(id => id === concurrentAwarder.user.id)).toHaveLength(1)

        const notifications = await concurrentTarget.fetch<{ notifications: Notification[] }>("/api/profile/notifications?dismissed=false&amount=20")
        expect(notifications.notifications.filter(notification =>
            notification.context === concurrentTarget.user.id
                && notification.message === `**${concurrentAwarder.user.name}** awarded you 256 tokens. Don't forget to thank them!`,
        )).toHaveLength(1)
    }
    finally {
        await restoreAwardState(concurrentAwarder.user, concurrentTarget.user, senderBefore.tokens, targetBefore.tokens)
    }
})

it("awards galleries with a token transfer and notification", async () => {
    const galleryId = `galleryAward${Date.now()}`
    const galleryRecord = `gallery:${galleryId}`
    const senderBefore = await awardSender.fetch<User>("/api/profile/authenticate")
    const authorBefore = await awardTarget.fetch<User>("/api/profile/authenticate")
    let galleryCreated = false

    try {
        await admin.query(`CREATE ONLY ${galleryRecord} SET user = ${authorBefore.id}, description = "Gallery award test";`)
        galleryCreated = true

        const selfAward = await awardTarget.fetchRaw(`/api/gallery/${galleryId}/award`, { method: "POST" })
        expectStatus(selfAward, 400)

        const award = () => awardSender.fetchRaw(`/api/gallery/${galleryId}/award`, { method: "POST" })
        expectStatus(await award(), 204)
        expectStatus(await award(), 409)

        const gallery = await admin.fetch<Gallery>(`/api/gallery/${galleryId}`)
        const senderAfter = await awardSender.fetch<User>("/api/profile/authenticate")
        const authorAfter = await awardTarget.fetch<User>("/api/profile/authenticate")
        expect(gallery.votes.awards).toContain(senderBefore.id)
        expect(senderAfter.tokens).toBe(senderBefore.tokens - 256)
        expect(authorAfter.tokens).toBe(authorBefore.tokens + 256)

        const notifications = await awardTarget.fetch<{ notifications: Notification[] }>("/api/profile/notifications?dismissed=false&amount=20")
        const notification = notifications.notifications.find(item => item.context === galleryRecord)
        expect(notification?.message).toContain("awarded your gallery")
    }
    finally {
        if (galleryCreated) {
            await admin.query(`
                UPDATE ${senderBefore.id} SET tokens = ${senderBefore.tokens};
                UPDATE ${authorBefore.id} SET tokens = ${authorBefore.tokens};
                DELETE notification WHERE recipient = ${authorBefore.id} AND context = ${galleryRecord};
                DELETE ${galleryRecord};
            `)
        }
    }
})

it("awards links with a token transfer and notification", async () => {
    const linkId = `linkAward${Date.now()}`
    const linkRecord = `link:${linkId}`
    const senderBefore = await awardSender.fetch<User>("/api/profile/authenticate")
    const authorBefore = await awardTarget.fetch<User>("/api/profile/authenticate")
    let linkCreated = false

    try {
        await admin.query(`
            CREATE ONLY ${linkRecord} SET
                user = ${authorBefore.id},
                title = "Link award test",
                url = "https://example.invalid/award";
        `)
        linkCreated = true

        expectStatus(await awardTarget.fetchRaw(`/api/link/${linkId}/award`, { method: "POST" }), 400)
        const award = () => awardSender.fetchRaw(`/api/link/${linkId}/award`, { method: "POST" })
        expectStatus(await award(), 204)
        expectStatus(await award(), 409)

        const links = await admin.query<Link[][]>(`SELECT * FROM ${linkRecord};`)
        const senderAfter = await awardSender.fetch<User>("/api/profile/authenticate")
        const authorAfter = await awardTarget.fetch<User>("/api/profile/authenticate")
        expect(links[0]?.[0]?.votes.awards).toContain(senderBefore.id)
        expect(senderAfter.tokens).toBe(senderBefore.tokens - 256)
        expect(authorAfter.tokens).toBe(authorBefore.tokens + 256)

        const notifications = await awardTarget.fetch<{ notifications: Notification[] }>("/api/profile/notifications?dismissed=false&amount=20")
        const notification = notifications.notifications.find(item => item.context === linkRecord)
        expect(notification?.message).toContain("awarded your link")
    }
    finally {
        if (linkCreated) {
            await admin.query(`
                UPDATE ${senderBefore.id} SET tokens = ${senderBefore.tokens};
                UPDATE ${authorBefore.id} SET tokens = ${authorBefore.tokens};
                DELETE notification WHERE recipient = ${authorBefore.id} AND context = ${linkRecord};
                DELETE ${linkRecord};
            `)
        }
    }
})

it("awards comments with a token transfer and notification", async () => {
    const senderBefore = await awardSender.fetch<User>("/api/profile/authenticate")
    const authorBefore = await awardTarget.fetch<User>("/api/profile/authenticate")
    const title = `Comment award test ${Date.now()}`
    let postRecord: string | undefined
    let commentRecord: string | undefined

    try {
        const postResponse = await awardTarget.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: { title, content: "Post for comment award test.", topics: [], images: [] },
        })
        expectStatus(postResponse, 200, "post creation stage")
        const post = postResponse._data!
        postRecord = post.id

        const commentResponse = await awardTarget.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: { context: post.id, replyTo: post.id, content: `Comment award test ${Date.now()}` },
        })
        expectStatus(commentResponse, 200, "comment creation stage")
        const comment = commentResponse._data!
        commentRecord = comment.id
        const commentId = extractId(comment.id)

        expectStatus(await fetch(`/api/comment/${commentId}/award`, { method: "POST" }), 401)
        expectStatus(await awardTarget.fetchRaw(`/api/comment/${commentId}/award`, { method: "POST" }), 400)

        const award = () => awardSender.fetchRaw(`/api/comment/${commentId}/award`, { method: "POST" })
        expectStatus(await award(), 204)
        expectStatus(await award(), 409)

        const comments = await admin.query<Array<Array<Comment>>>(`SELECT * FROM comment:${commentId};`)
        expect(comments[0]?.[0]?.votes.awards).toContain(senderBefore.id)

        const senderAfter = await awardSender.fetch<User>("/api/profile/authenticate")
        const authorAfter = await awardTarget.fetch<User>("/api/profile/authenticate")
        expect(senderAfter.tokens).toBe(senderBefore.tokens - 256)
        expect(authorAfter.tokens).toBe(authorBefore.tokens + 256)

        const notifications = await awardTarget.fetch<{ notifications: Notification[] }>("/api/profile/notifications?dismissed=false&amount=20")
        expect(notifications.notifications.some(notification =>
            notification.context === comment.id && notification.message.includes("awarded your comment"),
        )).toBe(true)
    }
    finally {
        await admin.query([
            `UPDATE ${senderBefore.id} SET tokens = ${senderBefore.tokens};`,
            `UPDATE ${authorBefore.id} SET tokens = ${authorBefore.tokens};`,
            ...(commentRecord ? [`DELETE notification WHERE context = ${commentRecord};`, `DELETE ${commentRecord};`] : []),
            ...(postRecord ? [`DELETE notification WHERE context = ${postRecord};`, `DELETE ${postRecord};`] : []),
        ].join("\n"))
    }
})

it("rejects awards from an empty balance without changing either account", async () => {
    const senderBefore = await insufficientAwarder.fetch<User>("/api/profile/authenticate")
    const targetBefore = await insufficientTarget.fetch<User>("/api/profile/authenticate")
    await admin.query(`UPDATE ${senderBefore.id} SET tokens = 0;`)

    try {
        const awardResponse = await insufficientAwarder.fetchRaw(`/api/user/${extractId(insufficientTarget.user.id)}/award`, { method: "POST" })
        expectStatus(awardResponse, 409)

        const senderAfter = await insufficientAwarder.fetch<User>("/api/profile/authenticate")
        const targetAfter = await insufficientTarget.fetch<User>("/api/profile/authenticate")
        expect(senderAfter.tokens).toBe(0)
        expect(targetAfter.tokens).toBe(targetBefore.tokens)
        expect(targetAfter.votes.awards).not.toContain(insufficientAwarder.user.id)

        const notifications = await insufficientTarget.fetch<{ notifications: Notification[] }>("/api/profile/notifications?dismissed=false&amount=20")
        expect(notifications.notifications.some(notification =>
            notification.context === insufficientTarget.user.id
                && notification.message === `**${insufficientAwarder.user.name}** awarded you 256 tokens. Don't forget to thank them!`,
        )).toBe(false)
    }
    finally {
        await restoreAwardState(insufficientAwarder.user, insufficientTarget.user, senderBefore.tokens, targetBefore.tokens)
    }
})