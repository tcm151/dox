import { expect, test } from "../utils/browser-fixtures"
import type { Locator, Page } from "@playwright/test"
import type { Comment, Post, Thread } from "../../shared/types"
import { extractId } from "../../shared/utils/records"

function apiUrl(page: Page, path: string) {
    return new URL(path, page.url()).toString()
}

async function signInAs(page: Page, session: { user: { id: string, name: string }, accessToken: string }) {
    await page.addInitScript((profile) => {
        window.sessionStorage.setItem("authenticated", JSON.stringify(true))
        window.sessionStorage.setItem("user", JSON.stringify(profile.user))
        window.localStorage.setItem("tokens", JSON.stringify({ access: profile.accessToken }))
    }, session)
    await page.goto("/feed")
    await expect(page.locator("nav").getByText(session.user.name, { exact: true })).toBeVisible()
}

async function createPost(page: Page, token: string, content: string): Promise<Post> {
    const response = await page.request.post(apiUrl(page, "/api/post/add"), {
        headers: { Authorization: token },
        data: { title: `Inline edit ${Date.now()}`, content, topics: [], images: [] },
    })
    expect(response.ok()).toBe(true)
    return await response.json() as Post
}

async function createThread(page: Page, token: string, content: string): Promise<Thread> {
    const response = await page.request.post(apiUrl(page, "/api/thread/add"), {
        headers: { Authorization: token },
        data: { content, topics: [], images: [] },
    })
    expect(response.ok()).toBe(true)
    return await response.json() as Thread
}

async function createComment(page: Page, token: string, postId: string, content: string): Promise<Comment> {
    const post = `post:${postId}`
    const response = await page.request.post(apiUrl(page, "/api/comment/add"), {
        headers: { Authorization: token },
        data: { context: post, replyTo: post, content },
    })
    expect(response.ok()).toBe(true)
    return await response.json() as Comment
}

async function readPost(page: Page, id: string): Promise<Pick<Post, "content" | "edited">> {
    const response = await page.request.get(apiUrl(page, `/api/post/${id}`))
    expect(response.ok()).toBe(true)
    const post = await response.json() as Post
    return { content: post.content, edited: post.edited }
}

async function readThread(page: Page, id: string): Promise<Pick<Thread, "content" | "edited">> {
    const response = await page.request.get(apiUrl(page, `/api/thread/${id}`))
    expect(response.ok()).toBe(true)
    const thread = await response.json() as Thread
    return { content: thread.content, edited: thread.edited }
}

async function readComment(page: Page, postId: string, commentId: string): Promise<Pick<Comment, "content" | "edited"> | undefined> {
    const response = await page.request.get(apiUrl(page, `/api/post/${postId}`))
    expect(response.ok()).toBe(true)
    const post = await response.json() as Post
    const comment = post.comments.find(item => extractId(item.id) === commentId)
    return comment && { content: comment.content, edited: comment.edited }
}

async function deleteRecord(page: Page, token: string, path: string): Promise<void> {
    const response = await page.request.get(apiUrl(page, path), {
        headers: { Authorization: token },
        timeout: 5_000,
    })
    expect(response.ok()).toBe(true)
}

async function withCleanup(runTest: () => Promise<void>, cleanup: () => Promise<void>): Promise<void> {
    let testError: unknown
    let hasTestError = false
    try {
        await runTest()
    }
    catch (error) {
        testError = error
        hasTestError = true
    }

    try {
        await cleanup()
    }
    catch (cleanupError) {
        if (!hasTestError) throw cleanupError
        console.error("Inline-edit browser test cleanup also failed.", cleanupError)
    }

    if (hasTestError) throw testError
}

type EditFlow = {
    page: Page
    editPath: string
    original: string
    content: Locator
    openEditor: () => Promise<Locator>
    cancel: () => Promise<void>
    save: () => Promise<void>
    readPersisted: () => Promise<Pick<Post, "content" | "edited"> | undefined>
}

async function verifyEditFlow(flow: EditFlow): Promise<void> {
    const cancelledDraft = `Cancelled ${flow.original}`
    const savedDraft = `Saved ${flow.original}`
    const routeMatcher = (url: string) => new URL(url).pathname === flow.editPath
    let saveRequests = 0
    const routeHandler = async (route: Parameters<Parameters<Page["route"]>[1]>[0]) => {
        saveRequests++
        if (saveRequests === 1) {
            await route.fulfill({
                status: 400,
                contentType: "application/json",
                body: JSON.stringify({ statusCode: 400, statusMessage: "Simulated save failure" }),
            })
            return
        }
        await route.continue()
    }

    await flow.page.route(routeMatcher, routeHandler)
    try {
        const editor = await flow.openEditor()
        await expect(editor).toHaveValue(flow.original)
        await editor.fill(cancelledDraft)
        await flow.cancel()
        expect(saveRequests).toBe(0)
        await expect(flow.content).toContainText(flow.original)

        const reopenedEditor = await flow.openEditor()
        await expect(reopenedEditor).toHaveValue(flow.original)
        await reopenedEditor.fill(savedDraft)

        const failedResponse = flow.page.waitForResponse(response =>
            new URL(response.url()).pathname === flow.editPath && response.status() === 400,
        )
        await flow.save()
        await failedResponse
        expect(saveRequests).toBe(1)
        await expect(reopenedEditor).toHaveValue(savedDraft)
        await expect.poll(flow.readPersisted).toEqual({ content: flow.original, edited: false })

        const savedResponse = flow.page.waitForResponse(response =>
            new URL(response.url()).pathname === flow.editPath && response.ok(),
        )
        await flow.save()
        await savedResponse
        expect(saveRequests).toBe(2)
        await expect.poll(flow.readPersisted).toEqual({ content: savedDraft, edited: true })
        await expect(flow.content).toContainText(savedDraft)
    }
    finally {
        await flow.page.unroute(routeMatcher, routeHandler)
    }
}

test("keeps post edits in a local draft until save succeeds", async ({ page, exampleServer }) => {
    test.setTimeout(60_000)
    const author = exampleServer.users.postAuthor
    const original = `Original post ${Date.now()}`
    await signInAs(page, author)
    let postId: string | undefined

    await withCleanup(async () => {
        const post = await createPost(page, author.accessToken, original)
        postId = extractId(post.id)
        await page.goto(`/post/${postId}`)
        const postPage = page.locator("section.post")

        await verifyEditFlow({
            page,
            editPath: `/api/post/${postId}/edit`,
            original,
            content: postPage.locator(".content"),
            openEditor: async () => {
                await postPage.locator("button.options").click()
                await page.getByRole("button", { name: /Edit/ }).click()
                return postPage.locator("textarea")
            },
            cancel: async () => postPage.getByRole("button", { name: "Cancel" }).click(),
            save: async () => postPage.getByRole("button", { name: "Save" }).click(),
            readPersisted: () => readPost(page, postId!),
        })
    }, async () => {
        if (postId) await deleteRecord(page, author.accessToken, `/api/post/${postId}/delete`)
    })
})

test("keeps thread edits in a local draft until save succeeds", async ({ page, exampleServer }) => {
    test.setTimeout(60_000)
    const author = exampleServer.users.threadAuthor
    const original = `Original thread ${Date.now()}`
    await signInAs(page, author)
    let threadId: string | undefined

    await withCleanup(async () => {
        const thread = await createThread(page, author.accessToken, original)
        threadId = extractId(thread.id)
        await page.goto(`/thread/${threadId}`)
        const threadPage = page.locator("section.main")

        await verifyEditFlow({
            page,
            editPath: `/api/thread/${threadId}/edit`,
            original,
            content: threadPage.locator(".content"),
            openEditor: async () => {
                await threadPage.locator("button[title='Options']").click()
                await page.getByRole("button", { name: /Edit/ }).click()
                return threadPage.locator("textarea")
            },
            cancel: async () => threadPage.getByRole("button", { name: "Cancel" }).click(),
            save: async () => threadPage.getByRole("button", { name: "Save" }).click(),
            readPersisted: () => readThread(page, threadId!),
        })
    }, async () => {
        if (threadId) await deleteRecord(page, author.accessToken, `/api/thread/${threadId}/delete`)
    })
})

test("keeps comment edits in a local draft until save succeeds", async ({ page, exampleServer }) => {
    test.setTimeout(60_000)
    const author = exampleServer.users.postAuthor
    const original = `Original comment ${Date.now()}`
    await signInAs(page, author)
    let postId: string | undefined
    let commentId: string | undefined

    await withCleanup(async () => {
        const post = await createPost(page, author.accessToken, `Comment target ${Date.now()}`)
        postId = extractId(post.id)
        const comment = await createComment(page, author.accessToken, postId, original)
        commentId = extractId(comment.id)
        await page.goto(`/post/${postId}`)
        const commentItem = page.locator("section.comments main.comment").first()

        await verifyEditFlow({
            page,
            editPath: `/api/comment/${commentId}/edit`,
            original,
            content: commentItem,
            openEditor: async () => {
                await commentItem.locator("[title='Options']").click()
                await page.getByRole("button", { name: /Edit/ }).click()
                return commentItem.locator(".comment-edit textarea")
            },
            cancel: async () => commentItem.locator(".comment-edit").getByText("Cancel", { exact: true }).click(),
            save: async () => commentItem.locator(".comment-edit").getByText("Save", { exact: true }).click(),
            readPersisted: () => readComment(page, postId!, commentId!),
        })
    }, async () => {
        if (commentId) await deleteRecord(page, author.accessToken, `/api/comment/${commentId}/delete`)
        if (postId) await deleteRecord(page, author.accessToken, `/api/post/${postId}/delete`)
    })
})
