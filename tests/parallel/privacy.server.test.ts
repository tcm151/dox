import { expect, it } from "vitest"
import type { FeedPage, Post, Sortable, Topic, User, UserSettings } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { expectStatus, fetch, grabUser, uniqueTestIp } from "../utils/test-server"

const admin = await grabUser("admin")
const password = "ProfilePrivacyTest-password"

type TestAccount = {
    accessToken: string
    user: User
}

async function createAccount(): Promise<TestAccount> {
    const suffix = `${Date.now()}${Math.random().toString(36).slice(2, 6)}`
    const username = `Privacy${suffix}`
    const response = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Forwarded-For": uniqueTestIp() },
        body: JSON.stringify({ username, email: `${username.toLowerCase()}@example.invalid`, password }),
    })
    expectStatus(response, 200, "register profile privacy test account")
    const accessToken = await response.text()

    const profileResponse = await fetch("/api/profile/authenticate", {
        headers: { Authorization: accessToken },
    })
    expectStatus(profileResponse, 200, "authenticate profile privacy test account")
    return { accessToken, user: await profileResponse.json() as User }
}

async function get<T>(path: string, accessToken?: string): Promise<T> {
    const response = await fetch(path, {
        headers: accessToken ? { Authorization: accessToken } : {},
    })
    if (response.status !== 200) {
        throw new Error(`GET ${path} failed with ${response.status}: ${await response.text()}`)
    }
    return await response.json() as T
}

async function setProfileVisibility(account: TestAccount, profile: UserSettings["privacy"]["profile"]) {
    const settings = await get<UserSettings>("/api/profile/settings", account.accessToken)
    const response = await fetch("/api/profile/settings/update", {
        method: "PUT",
        headers: { Authorization: account.accessToken, "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, privacy: { profile } }),
    })
    expectStatus(response, 200, `set profile audience to ${profile}`)
}

it("enforces profile audiences without hiding individually public content", async () => {
    const accounts: TestAccount[] = []
    let postId: string | undefined
    let topicId: string | undefined

    try {
        const owner = await createAccount()
        accounts.push(owner)
        const member = await createAccount()
        accounts.push(member)
        const id = extractId(owner.user.id)
        const marker = `Profile privacy ${Date.now()}`
        const topicSuffix = `profileprivacy${Date.now()}`
        topicId = `topic:${topicSuffix}`

        const profileUpdate = await fetch("/api/profile/update", {
            method: "POST",
            headers: { Authorization: owner.accessToken, "Content-Type": "application/json" },
            body: JSON.stringify({
                name: owner.user.name,
                link: "https://profile-privacy.example",
                description: marker,
            }),
        })
        expectStatus(profileUpdate, 200, "add profile privacy details")

        const postResponse = await fetch("/api/post/add", {
            method: "POST",
            headers: { Authorization: owner.accessToken, "Content-Type": "application/json" },
            body: JSON.stringify({
                title: marker,
                content: "This public post remains directly accessible.",
                topics: [],
                images: [],
            }),
        })
        expectStatus(postResponse, 200, "create public profile-feed item")
        const post = await postResponse.json() as Post
        postId = extractId(post.id)

        await admin.query(`CREATE ONLY ${topicId};`)
        await admin.query(`
            UPDATE ${owner.user.id} SET
                followers = [${member.user.id}],
                following = [${member.user.id}],
                topics = [${topicId}];
        `)

        const initialSettings = await get<UserSettings>("/api/profile/settings", owner.accessToken)
        expect(initialSettings.privacy.profile).toBe("public")

        const invalidSettings = await fetch("/api/profile/settings/update", {
            method: "PUT",
            headers: { Authorization: owner.accessToken, "Content-Type": "application/json" },
            body: JSON.stringify({ ...initialSettings, privacy: { profile: "friends" } }),
        })
        expectStatus(invalidSettings, 400, "reject unsupported profile audience")
        expect((await get<UserSettings>("/api/profile/settings", owner.accessToken)).privacy.profile).toBe("public")

        const publicProfile = await get<User>(`/api/user/${id}`)
        expect(publicProfile.visible).toBe(true)
        expect(publicProfile.link).toBe("https://profile-privacy.example")
        expect(publicProfile.description).toBe(marker)
        expect(publicProfile.followers).toContain(member.user.id)
        expect(publicProfile.following).toContain(member.user.id)
        expect(publicProfile.topics).toContain(topicId)
        expect((await get<User[]>("/api/user")).some(user => user.id === owner.user.id)).toBe(true)
        expect((await get<FeedPage<Sortable>>(`/api/user/${id}/feed?sortBy=new`)).items.some(item => item.id === post.id)).toBe(true)

        await setProfileVisibility(owner, "members")
        const anonymousMemberProfile = await get<User>(`/api/user/${id}`)
        expect(anonymousMemberProfile.visible).toBe(false)
        expect(anonymousMemberProfile).not.toHaveProperty("link")
        expect(anonymousMemberProfile).not.toHaveProperty("description")
        expect(anonymousMemberProfile.followers).toEqual([])
        expect(anonymousMemberProfile.following).toEqual([])
        expect(anonymousMemberProfile.topics).toEqual([])
        expect((await get<User[]>("/api/user")).some(user => user.id === owner.user.id)).toBe(false)
        expect((await get<FeedPage<Sortable>>(`/api/user/${id}/feed?sortBy=new`)).items).toEqual([])
        expect(await get<User[]>(`/api/user/${id}/followers`)).toEqual([])
        expect(await get<User[]>(`/api/user/${id}/following`)).toEqual([])
        expect(await get<Topic[]>(`/api/user/${id}/topics`)).toEqual([])

        const memberProfile = await get<User>(`/api/user/${id}`, member.accessToken)
        expect(memberProfile.visible).toBe(true)
        expect(memberProfile.link).toBe("https://profile-privacy.example")
        expect((await get<User[]>("/api/user", member.accessToken)).some(user => user.id === owner.user.id)).toBe(true)
        expect((await get<FeedPage<Sortable>>(`/api/user/${id}/feed?sortBy=new`, member.accessToken)).items.some(item => item.id === post.id)).toBe(true)
        expect(await get<User[]>(`/api/user/${id}/followers`, member.accessToken)).toHaveLength(1)
        expect(await get<User[]>(`/api/user/${id}/following`, member.accessToken)).toHaveLength(1)
        expect(await get<Topic[]>(`/api/user/${id}/topics`, member.accessToken)).toHaveLength(1)

        await setProfileVisibility(owner, "private")
        expect((await get<User>(`/api/user/${id}`)).visible).toBe(false)
        expect((await get<User>(`/api/user/${id}`, member.accessToken)).visible).toBe(false)
        expect((await get<User[]>("/api/user", member.accessToken)).some(user => user.id === owner.user.id)).toBe(false)
        expect((await get<FeedPage<Sortable>>(`/api/user/${id}/feed?sortBy=new`, member.accessToken)).items).toEqual([])
        expect((await get<User>(`/api/user/${id}`, owner.accessToken)).visible).toBe(true)
        expect((await get<FeedPage<Sortable>>(`/api/user/${id}/feed?sortBy=new`, owner.accessToken)).items.some(item => item.id === post.id)).toBe(true)
        expect((await get<User[]>("/api/user", owner.accessToken)).some(user => user.id === owner.user.id)).toBe(true)
        const adminProfile = await get<User>(`/api/user/${id}`, admin.accessToken)
        expect(adminProfile).toMatchObject({ visible: true, link: "https://profile-privacy.example" })
        expect((await get<User[]>("/api/user", admin.accessToken)).some(user => user.id === owner.user.id)).toBe(true)
        expect((await get<FeedPage<Sortable>>(`/api/user/${id}/feed?sortBy=new`, admin.accessToken)).items.some(item => item.id === post.id)).toBe(true)

        const publicPost = await fetch(`/api/post/${postId}`)
        expectStatus(publicPost, 200, "direct public post after profile feed is hidden")
        expect((await publicPost.json() as Post).id).toBe(post.id)
    }
    finally {
        const userIds = accounts.map(account => account.user.id)
        const sessionIds = accounts.map(account => account.accessToken)
        if (postId) await admin.query(`DELETE post:${postId};`)
        if (userIds.length) {
            await admin.query(`UPDATE user SET topics = [] WHERE id IN [${userIds.join(", ")}];`)
        }
        if (topicId) await admin.query(`DELETE ${topicId};`)
        if (sessionIds.length) await admin.query(`DELETE session WHERE id IN [${sessionIds.join(", ")}];`)
        if (userIds.length) {
            await admin.query(`DELETE userSettings WHERE user IN [${userIds.join(", ")}];`)
            await admin.query(`DELETE account WHERE user IN [${userIds.join(", ")}];`)
            await admin.query(`DELETE user WHERE id IN [${userIds.join(", ")}];`)
        }
    }
})
