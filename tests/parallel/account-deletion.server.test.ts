import { expect, it } from "vitest"
import type { Comment, Post, Thread, User } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { expectStatus, fetch, grabExampleServer, grabUser } from "../utils/test-server"

const admin = await grabUser("admin")
const otherUser = (await grabExampleServer("default")).users.commentAuthor
const accountPassword = "AccountDeletionTest-password"

async function createAccount() {
    const username = `Delete${Date.now()}${Math.random().toString(36).slice(2, 6)}`
    const email = `${username.toLowerCase()}@example.invalid`
    const registerResponse = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password: accountPassword }),
    })
    expectStatus(registerResponse, 200, "account registration stage")
    const accessToken = await registerResponse.text()

    const profileResponse = await fetch("/api/profile/authenticate", {
        headers: { Authorization: accessToken },
    })
    expectStatus(profileResponse, 200, "account authentication stage")
    const user = await profileResponse.json() as User
    return { accessToken, user, username }
}

function accountFetch(accessToken: string, url: string, body?: unknown) {
    return fetch(url, {
        method: body === undefined ? "GET" : "POST",
        headers: {
            Authorization: accessToken,
            ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
}

async function createPost(accessToken: string, title: string, content: string) {
    const response = await accountFetch(accessToken, "/api/post/add", { title, content, topics: [], images: [] })
    expectStatus(response, 200, "post creation stage")
    return await response.json() as Post
}

async function cleanupTestData(
    user: User,
    accessToken: string,
    postIds: string[],
    threadIds: string[],
) {
    const ids = [...postIds, ...threadIds]
    const statements = [
        `DELETE comment WHERE user = ${user.id}${postIds.length ? ` OR context IN [${postIds.join(", ")}]` : ""};`,
        ...threadIds.slice(1).map(id => `DELETE ${id};`),
        ...threadIds.slice(0, 1).map(id => `DELETE ${id};`),
        ...(postIds.length ? [`DELETE post WHERE id IN [${postIds.join(", ")}];`] : []),
        ...(ids.length ? [`DELETE notification WHERE context IN [${ids.join(", ")}];`] : []),
        `DELETE session WHERE id = ${accessToken};`,
        `DELETE account WHERE user = ${user.id};`,
        `DELETE userSettings WHERE user = ${user.id};`,
        `DELETE ${user.id};`,
    ]
    await admin.query(statements.join("\n"))
}

it("deletes an account while retaining anonymized published content and vote history", async () => {
    const account = await createAccount()
    const post = await createPost(account.accessToken, `Retained ${Date.now()}`, "Historical content stays.")
    const postId = extractId(post.id)!

    try {
        const rejected = await accountFetch(account.accessToken, "/api/profile/account/delete", {
            password: "incorrect-password",
            confirmation: account.username,
        })
        expectStatus(rejected, 403, "incorrect password stage")

        const retained = await accountFetch(account.accessToken, "/api/profile/account/delete", {
            password: accountPassword,
            confirmation: account.username,
        })
        expectStatus(retained, 204)

        const records = await admin.query<Array<Array<Pick<Post, "id" | "user" | "title" | "content" | "votes">>>>(
            `SELECT id, user, title, content, votes FROM post:${postId};`,
        )
        expect(records[0]?.[0]).toMatchObject({
            id: post.id,
            user: "user:deleted",
            title: post.title,
            content: post.content,
        })
        expect(records[0]?.[0]?.votes.positive).toContain(account.user.id)

        const removedUser = await admin.query<Array<Array<string>>>(`SELECT VALUE id FROM user WHERE id = ${account.user.id};`)
        const removedAccount = await admin.query<Array<Array<string>>>(`SELECT VALUE id FROM account WHERE user = ${account.user.id};`)
        const removedSession = await admin.query<Array<Array<string>>>(`SELECT VALUE id FROM session WHERE id = ${account.accessToken};`)
        expect(removedUser[0]).toEqual([])
        expect(removedAccount[0]).toEqual([])
        expect(removedSession[0]).toEqual([])
    }
    finally {
        await cleanupTestData(account.user, account.accessToken, [post.id], [])
    }
})

it("wipes interacted submissions and permanently deletes unreferenced submissions", async () => {
    const account = await createAccount()
    const timestamp = Date.now()
    const retainedPost = await createPost(account.accessToken, `Interacted ${timestamp}`, "Remove this text.")
    const unreferencedPost = await createPost(account.accessToken, `Unreferenced ${timestamp}`, "Remove this record.")
    const otherPostResponse = await otherUser.fetchRaw<Post>("/api/post/add", {
        method: "POST",
        body: { title: `Other user ${timestamp}`, content: "Comment target.", topics: [], images: [] },
    })
    expectStatus(otherPostResponse, 200, "other user's post creation stage")
    const otherPost = otherPostResponse._data!

    const commentResponse = await otherUser.fetchRaw<Comment>("/api/comment/add", {
        method: "POST",
        body: {
            context: retainedPost.id,
            replyTo: retainedPost.id,
            content: `Keep this comment ${timestamp}.`,
        },
    })
    expectStatus(commentResponse, 200, "other user's comment stage")
    const otherComment = commentResponse._data!

    const threadResponse = await accountFetch(account.accessToken, "/api/thread/add", {
        content: `Remove this thread text ${timestamp}.`,
        topics: [],
        images: [],
    })
    expectStatus(threadResponse, 200, "thread creation stage")
    const retainedThread = await threadResponse.json() as Thread

    const quoteResponse = await otherUser.fetchRaw<Thread>(`/api/thread/${extractId(retainedThread.id)}/quote`, {
        method: "POST",
        body: { content: `A quote ${timestamp}`, topics: [] },
    })
    expectStatus(quoteResponse, 200, "other user's quote stage")
    const quote = quoteResponse._data!

    try {
        const deletion = await accountFetch(account.accessToken, "/api/profile/account/wipe", {
            password: accountPassword,
            confirmation: account.username,
        })
        expectStatus(deletion, 204)

        const keptPost = await admin.query<Array<Array<Pick<Post, "user" | "title" | "content" | "status" | "deleted" | "images" | "votes">>>>(
            `SELECT user, title, content, status, deleted, images, votes FROM post:${extractId(retainedPost.id)};`,
        )
        expect(keptPost[0]?.[0]).toMatchObject({
            user: "user:deleted",
            title: "[deleted]",
            content: "[deleted]",
            status: "deleted",
            deleted: true,
            images: [],
        })
        expect(keptPost[0]?.[0]?.votes.positive).toContain(account.user.id)

        const missingPost = await admin.query<Array<Array<string>>>(`SELECT VALUE id FROM post:${extractId(unreferencedPost.id)};`)
        expect(missingPost[0]).toEqual([])

        const keptComment = await admin.query<Array<Array<Pick<Comment, "id" | "content" | "user">>>>(
            `SELECT id, content, user FROM comment:${extractId(otherComment.id)};`,
        )
        expect(keptComment[0]?.[0]).toMatchObject({ id: otherComment.id, content: otherComment.content, user: otherUser.user.id })

        const keptThread = await admin.query<Array<Array<Pick<Thread, "user" | "content" | "status" | "deleted">>>>(
            `SELECT user, content, status, deleted FROM thread:${extractId(retainedThread.id)};`,
        )
        expect(keptThread[0]?.[0]).toMatchObject({
            user: "user:deleted",
            content: "[deleted]",
            status: "deleted",
            deleted: true,
        })
        const keptQuote = await admin.query<Array<Array<Pick<Thread, "id" | "content" | "quote">>>>(
            `SELECT id, content, quote FROM thread:${extractId(quote.id)};`,
        )
        expect(keptQuote[0]?.[0]).toMatchObject({ id: quote.id, content: quote.content, quote: retainedThread.id })
    }
    finally {
        await cleanupTestData(
            account.user,
            account.accessToken,
            [retainedPost.id, unreferencedPost.id, otherPost.id],
            [retainedThread.id, quote.id],
        )
    }
})
