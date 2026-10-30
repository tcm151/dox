import { expect, it } from "vitest"
import { expectStatus, fetch, grabExampleServer, grabUser, testAdminCredentials } from "../test-server"
import { extractId } from "../../shared/utils/records"
import type { Notification, User } from "../../shared/types"

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