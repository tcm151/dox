import { expect, it } from "vitest"
import { fetch, grabExampleServer, grabUser, testAdminCredentials } from "../test-server"
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

async function getProfile(accessToken: string) {
    const response = await fetch("/api/profile/authenticate", {
        headers: { Authorization: accessToken },
    })
    expect(response.status).toBe(200)
    return await response.json() as User
}

async function restoreAwardState(sender: User, target: User, senderTokens: number, targetTokens: number) {
    const message = `**${sender.name}** awarded you 256 tokens. Don't forget to thank them!`
    const response = await fetch("/api/developer/database/query", {
        method: "POST",
        headers: {
            Authorization: admin.accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query: `
                UPDATE ${sender.id} SET tokens = ${senderTokens};
                UPDATE ${target.id} SET tokens = ${targetTokens};
                IF ${target.id}.votes.awards CONTAINS ${sender.id} {
                    UPDATE ${target.id} SET
                        votes.awards = array::difference(votes.awards, [${sender.id}]);
                };
                DELETE notification WHERE recipient = ${target.id}
                    AND context = ${target.id}
                    AND message = "${message}";
            `,
        }),
    })
    expect(response.status, await response.clone().text()).toBe(200)
}

it("lists users and returns the configured admin", async () => {
    const response = await fetch("/api/user")
    expect(response.status).toBe(200)

    const users = await response.json() as UserSummary[]
    const admin = users.find(user => user.name === testAdminCredentials.name)
    expect(admin).toBeDefined()
    expect(admin?.roles).toEqual(expect.arrayContaining(["admin", "moderator", "developer"]))
})

it("follows and unfollows a user with idempotent state updates", async () => {
    const followerId = extractId(follower.user.id)
    const followedUserId = extractId(followedUser.user.id)
    const follow = () => fetch(`/api/user/${followedUserId}/follow`, {
        method: "POST",
        headers: { Authorization: follower.accessToken },
    })
    const unfollow = () => fetch(`/api/user/${followedUserId}/unfollow`, {
        method: "POST",
        headers: { Authorization: follower.accessToken },
    })

    try {
        const unauthenticatedFollow = await fetch(`/api/user/${followedUserId}/follow`, { method: "POST" })
        expect(unauthenticatedFollow.status).toBe(401)

        expect((await follow()).status).toBe(200)
        expect((await follow()).status).toBe(200)

        const followerProfileResponse = await fetch(`/api/user/${followerId}`)
        expect(followerProfileResponse.status).toBe(200)
        const followerProfile = await followerProfileResponse.json() as User
        expect(followerProfile.following).toContain(followedUser.user.id)

        const followedProfileResponse = await fetch(`/api/user/${followedUserId}`)
        expect(followedProfileResponse.status).toBe(200)
        const followedProfile = await followedProfileResponse.json() as User
        expect(followedProfile.followers).toContain(follower.user.id)

        expect((await unfollow()).status).toBe(200)
        expect((await unfollow()).status).toBe(200)

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
    expect(unauthenticatedSave.status).toBe(401)

    const selfAward = await fetch(`/api/user/${extractId(awardSender.user.id)}/award`, {
        method: "POST",
        headers: { Authorization: awardSender.accessToken },
    })
    expect(selfAward.status).toBe(400)

    const selfSave = await fetch(`/api/user/${subscriberId}/save`, {
        method: "POST",
        headers: { Authorization: subscriber.accessToken },
    })
    expect(selfSave.status).toBe(400)

    const save = () => fetch(`/api/user/${awardTargetId}/save`, {
        method: "POST",
        headers: { Authorization: subscriber.accessToken },
    })
    expect((await save()).status).toBe(200)
    expect((await save()).status).toBe(200)

    const savedProfileResponse = await fetch(`/api/user/${awardTargetId}`)
    expect(savedProfileResponse.status).toBe(200)
    const savedProfile = await savedProfileResponse.json() as User
    expect(savedProfile.votes.saves).toContain(subscriber.user.id)

    const unsave = () => fetch(`/api/user/${awardTargetId}/unsave`, {
        method: "POST",
        headers: { Authorization: subscriber.accessToken },
    })
    expect((await unsave()).status).toBe(200)
    expect((await unsave()).status).toBe(200)

    const unsavedProfileResponse = await fetch(`/api/user/${awardTargetId}`)
    const unsavedProfile = await unsavedProfileResponse.json() as User
    expect(unsavedProfile.votes.saves).not.toContain(subscriber.user.id)

    const awarderBeforeResponse = await fetch("/api/profile/authenticate", {
        headers: { Authorization: awardSender.accessToken },
    })
    const awarderBefore = await awarderBeforeResponse.json() as User
    const award = () => fetch(`/api/user/${awardTargetId}/award`, {
        method: "POST",
        headers: { Authorization: awardSender.accessToken },
    })
    expect((await award()).status).toBe(200)
    expect((await award()).status).toBe(409)

    const awarderAfterResponse = await fetch("/api/profile/authenticate", {
        headers: { Authorization: awardSender.accessToken },
    })
    const awarderAfter = await awarderAfterResponse.json() as User
    const awardedProfileResponse = await fetch("/api/profile/authenticate", {
        headers: { Authorization: awardTarget.accessToken },
    })
    const awardedProfile = await awardedProfileResponse.json() as User
    const awardedPublicProfileResponse = await fetch(`/api/user/${awardTargetId}`)
    const awardedPublicProfile = await awardedPublicProfileResponse.json() as User
    expect(awarderAfter.tokens).toBe(awarderBefore.tokens - 256)
    expect(awardedProfile.tokens).toBe(awardTarget.user.tokens + 256)
    expect(awardedPublicProfile.votes.awards).toContain(awardSender.user.id)

    const notificationsResponse = await fetch("/api/profile/notifications?dismissed=false&amount=10", {
        headers: { Authorization: awardTarget.accessToken },
    })
    expect(notificationsResponse.status).toBe(200)
    const notifications = await notificationsResponse.json() as { notifications: Notification[] }
    expect(notifications.notifications[0]?.context).toBe(awardTarget.user.id)
    expect(notifications.notifications[0]?.message).toContain("awarded you 256 tokens")
})

it("allows only one of two concurrent awards and records one notification", async () => {
    const senderBefore = await getProfile(concurrentAwarder.accessToken)
    const targetBefore = await getProfile(concurrentTarget.accessToken)
    const award = () => fetch(`/api/user/${extractId(concurrentTarget.user.id)}/award`, {
        method: "POST",
        headers: { Authorization: concurrentAwarder.accessToken },
    })

    try {
        const responses = await Promise.all([award(), award()])
        const statuses = responses.map(response => response.status).sort()
        const responseDetails = await Promise.all(responses.map(async response =>
            `${response.status}: ${await response.clone().text()}`,
        ))
        expect(statuses, responseDetails.join("\n")).toEqual([200, 409])

        const senderAfter = await getProfile(concurrentAwarder.accessToken)
        const targetAfter = await getProfile(concurrentTarget.accessToken)
        expect(senderAfter.tokens).toBe(senderBefore.tokens - 256)
        expect(targetAfter.tokens).toBe(targetBefore.tokens + 256)
        expect(targetAfter.votes.awards.filter(id => id === concurrentAwarder.user.id)).toHaveLength(1)

        const notificationsResponse = await fetch("/api/profile/notifications?dismissed=false&amount=20", {
            headers: { Authorization: concurrentTarget.accessToken },
        })
        expect(notificationsResponse.status).toBe(200)
        const notifications = await notificationsResponse.json() as { notifications: Notification[] }
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
    const senderBefore = await getProfile(insufficientAwarder.accessToken)
    const targetBefore = await getProfile(insufficientTarget.accessToken)
    const emptyBalanceResponse = await fetch("/api/developer/database/query", {
        method: "POST",
        headers: {
            Authorization: admin.accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: `UPDATE ${senderBefore.id} SET tokens = 0;` }),
    })
    expect(emptyBalanceResponse.status, await emptyBalanceResponse.clone().text()).toBe(200)

    try {
        const awardResponse = await fetch(`/api/user/${extractId(insufficientTarget.user.id)}/award`, {
            method: "POST",
            headers: { Authorization: insufficientAwarder.accessToken },
        })
        expect(awardResponse.status).toBe(409)

        const senderAfter = await getProfile(insufficientAwarder.accessToken)
        const targetAfter = await getProfile(insufficientTarget.accessToken)
        expect(senderAfter.tokens).toBe(0)
        expect(targetAfter.tokens).toBe(targetBefore.tokens)
        expect(targetAfter.votes.awards).not.toContain(insufficientAwarder.user.id)

        const notificationsResponse = await fetch("/api/profile/notifications?dismissed=false&amount=20", {
            headers: { Authorization: insufficientTarget.accessToken },
        })
        expect(notificationsResponse.status).toBe(200)
        const notifications = await notificationsResponse.json() as { notifications: Notification[] }
        expect(notifications.notifications.some(notification =>
            notification.context === insufficientTarget.user.id
                && notification.message === `**${insufficientAwarder.user.name}** awarded you 256 tokens. Don't forget to thank them!`,
        )).toBe(false)
    }
    finally {
        await restoreAwardState(insufficientAwarder.user, insufficientTarget.user, senderBefore.tokens, targetBefore.tokens)
    }
})