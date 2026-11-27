import { randomUUID } from "node:crypto"
import { expect, it } from "vitest"
import type { FeedPage, Post, Sortable, User } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { expectStatus, fetch, grabUser, uniqueTestIp } from "../utils/test-server"

const admin = await grabUser("admin")
const password = "MutualsFeedTest-password"

interface MutualsTestAccount {
    accessToken: string
    user: User
}

async function createAccount(): Promise<MutualsTestAccount> {
    const username = `Mutual${randomUUID().replaceAll("-", "").slice(0, 12)}`
    const registerResponse = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Forwarded-For": uniqueTestIp() },
        body: JSON.stringify({
            username,
            email: `${username.toLowerCase()}@example.invalid`,
            password,
        }),
    })
    expectStatus(registerResponse, 200, "mutuals account registration stage")
    const accessToken = await registerResponse.text()
    const profileResponse = await fetch("/api/profile/authenticate", {
        headers: { Authorization: accessToken },
    })
    expectStatus(profileResponse, 200, "mutuals account authentication stage")
    return { accessToken, user: await profileResponse.json() as User }
}

function accountFetch(account: MutualsTestAccount, path: string, body?: unknown) {
    return fetch(path, {
        method: body === undefined ? "GET" : "POST",
        headers: {
            Authorization: account.accessToken,
            ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
}

async function publishPost(author: MutualsTestAccount, title: string): Promise<string> {
    const response = await accountFetch(author, "/api/post/add", {
        title,
        content: "Created by the mutuals feed test.",
        topics: [],
        images: [],
    })
    expectStatus(response, 200, `mutuals post stage: ${title}`)
    return (await response.json() as Post).id
}

async function fetchMutuals(viewer: MutualsTestAccount, query = "") {
    const response = await accountFetch(viewer, `/api/feed/mutuals${query}`)
    expectStatus(response, 200, `mutuals page stage: ${query}`)
    return await response.json() as FeedPage<Sortable>
}

it("limits the mutuals feed to filtered reciprocal follows with bounded pagination", async () => {
    const accounts: MutualsTestAccount[] = []
    const postIds: string[] = []

    try {
        const viewer = await createAccount()
        const reciprocalA = await createAccount()
        const reciprocalB = await createAccount()
        const oneWay = await createAccount()
        const fan = await createAccount()
        accounts.push(viewer, reciprocalA, reciprocalB, oneWay, fan)

        const run = randomUUID().slice(0, 8)
        const reciprocalAPost = await publishPost(reciprocalA, `Mutual A ${run}`)
        const reciprocalBPost = await publishPost(reciprocalB, `Mutual B ${run}`)
        const oneWayPost = await publishPost(oneWay, `One way ${run}`)
        const fanPost = await publishPost(fan, `Fan only ${run}`)
        postIds.push(reciprocalAPost, reciprocalBPost, oneWayPost, fanPost)

        // Reciprocal follows for A and B; one-way follows in each direction for the others.
        for (const author of [reciprocalA, reciprocalB]) {
            expectStatus(await accountFetch(viewer, `/api/user/${extractId(author.user.id)}/follow`), 200)
            expectStatus(await accountFetch(author, `/api/user/${extractId(viewer.user.id)}/follow`), 200)
        }
        expectStatus(await accountFetch(viewer, `/api/user/${extractId(oneWay.user.id)}/follow`), 200)
        expectStatus(await accountFetch(fan, `/api/user/${extractId(viewer.user.id)}/follow`), 200)

        expectStatus(await fetch("/api/feed/mutuals"), 401, "unauthenticated mutuals stage")

        // Deterministic `new` ordering: B is most recent, A one hour older.
        // The feed view recomputes from the source records.
        await admin.query(`
            LET $now = time::now();
            UPDATE ${reciprocalAPost} SET time = $now - 1h;
            UPDATE ${reciprocalBPost} SET time = $now;
        `)

        const fullPage = await fetchMutuals(viewer, "?sortBy=new&pageSize=20")
        expect(fullPage.items.map(item => item.id)).toEqual([reciprocalBPost, reciprocalAPost])
        expect(fullPage.more).toBe(false)

        const firstPage = await fetchMutuals(viewer, "?sortBy=new&pageSize=1&offset=0")
        expect(firstPage.items.map(item => item.id)).toEqual([reciprocalBPost])
        expect(firstPage.pageSize).toBe(1)
        expect(firstPage.offset).toBe(0)
        expect(firstPage.more).toBe(true)

        const secondPage = await fetchMutuals(viewer, "?sortBy=new&pageSize=1&offset=1")
        expect(secondPage.items.map(item => item.id)).toEqual([reciprocalAPost])
        expect(secondPage.offset).toBe(1)
        expect(secondPage.more).toBe(false)

        // Muting a mutual author removes their content; unmuting restores it.
        expectStatus(await accountFetch(viewer, "/api/profile/filters/mute", { target: reciprocalB.user.id }), 200)
        const mutedPage = await fetchMutuals(viewer, "?sortBy=new&pageSize=20")
        expect(mutedPage.items.map(item => item.id)).toEqual([reciprocalAPost])

        expectStatus(await accountFetch(viewer, "/api/profile/filters/unmute", { target: reciprocalB.user.id }), 200)
        const unmutedPage = await fetchMutuals(viewer, "?sortBy=new&pageSize=20")
        expect(unmutedPage.items.map(item => item.id)).toEqual([reciprocalBPost, reciprocalAPost])
    }
    finally {
        const userIds = accounts.map(account => account.user.id)
        await admin.query(`
            ${postIds.map(id => `DELETE notification WHERE context = ${id}; DELETE ${id};`).join("\n")}
            ${userIds.length > 0 ? `
                DELETE session WHERE account IN (SELECT VALUE id FROM account WHERE user IN [${userIds.join(", ")}]);
                DELETE account WHERE user IN [${userIds.join(", ")}];
                DELETE userSettings WHERE user IN [${userIds.join(", ")}];
                DELETE user WHERE id IN [${userIds.join(", ")}];
            ` : ""}
        `)
    }
}, 60_000)
