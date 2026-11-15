import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { expect, test as base, type Page } from "@playwright/test"
import type { TExampleServer, TSession } from "./test-sessions"

function getTestDataDirectory() {
    const directory = process.env.CLASSICFORUM_TEST_DATA_DIRECTORY
    if (!directory?.startsWith(".test-output-") || directory.includes("..")) {
        throw new Error("Run browser tests through `yarn test` to load isolated test data.")
    }
    return directory
}

type BrowserFixtures = {
    authenticatedPage: Page
    exampleServer: TExampleServer
}

export const test = base.extend<BrowserFixtures>({
    exampleServer: async ({}, use) => {
        const testDataDirectory = getTestDataDirectory()
        const exampleServerPath = join(testDataDirectory, "state", "example-servers", "default.json")
        let contents: string
        try {
            contents = await readFile(exampleServerPath, "utf8")
        }
        catch {
            throw new Error("The browser example server was not seeded by the sequential setup phase.")
        }

        const exampleServer: TExampleServer = JSON.parse(contents)
        if (!exampleServer.users.postAuthor?.accessToken) {
            throw new Error("The browser example server is missing its seeded post author.")
        }

        await use(exampleServer)
    },
    authenticatedPage: async ({ page }, use) => {
        const testDataDirectory = getTestDataDirectory()
        const adminSessionPath = join(testDataDirectory, "state", "users", "admin.json")
        const adminSession = JSON.parse(await readFile(adminSessionPath, "utf8")) as TSession
        if (!adminSession.accessToken || !adminSession.user?.name) {
            throw new Error("The browser admin session was not seeded by the sequential setup phase.")
        }

        await page.addInitScript((session) => {
            window.sessionStorage.setItem("authenticated", JSON.stringify(true))
            window.sessionStorage.setItem("user", JSON.stringify(session.user))
            window.localStorage.setItem("tokens", JSON.stringify({ access: session.accessToken }))
        }, adminSession)
        await page.goto("/feed")
        await expect(page.locator("nav").getByText(adminSession.user.name, { exact: true })).toBeVisible()
        await use(page)
    },
})

export { expect }