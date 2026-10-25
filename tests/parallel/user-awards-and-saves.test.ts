import { expect, it } from "vitest"
import { fetch, grabExampleServer } from "../test-server"
import { extractId } from "../../shared/utils/records"
import type { Notification, User } from "../../shared/types"

const exampleServer = await grabExampleServer("default")
const awardSender = exampleServer.users.awardSender
const awardTarget = exampleServer.users.awardTarget
const subscriber = exampleServer.users.subscriber

it("awards users and saves or removes user subscriptions", async () => {
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