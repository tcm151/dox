import { expect, test } from "../utils/browser-fixtures"

const adminName = process.env.CLASSICFORUM_TEST_ADMIN_NAME!
const adminPassword = process.env.CLASSICFORUM_TEST_ADMIN_PASSWORD!

test("switches to a saved profile without reloading or changing the route", async ({ page, exampleServer }) => {
    const profile = exampleServer.users.threadAuthor

    await page.addInitScript((savedProfiles) => {
        localStorage.setItem("profiles", JSON.stringify(savedProfiles))
        const documentLoads = Number(sessionStorage.getItem("test-document-loads") ?? "0")
        sessionStorage.setItem("test-document-loads", String(documentLoads + 1))
    }, [{
        id: profile.user.id,
        name: profile.user.name,
        token: profile.accessToken,
    }])
    await page.goto("/feed/home")

    await page.locator("nav").getByText("Login", { exact: true }).click()
    await expect(page.getByRole("heading", { name: "Profiles" })).toBeVisible()
    await page.getByText("New Login", { exact: true }).click()
    await page.locator("main.form input[type='text']").fill(adminName)
    await page.locator("main.form input[type='password']").fill(adminPassword)
    await page.getByRole("button", { name: "Login", exact: true }).click()
    await expect(page.locator("nav").getByText(adminName, { exact: true })).toBeVisible()

    await page.locator("nav").getByRole("link", { name: new RegExp(adminName) }).click({ button: "right" })
    await expect(page.getByRole("heading", { name: "Profiles" })).toBeVisible()
    await page.locator("main.window").getByRole("button", { name: profile.user.name }).click()

    await expect(page.locator("nav").getByText(profile.user.name, { exact: true })).toBeVisible()
    await expect(page).toHaveURL(/\/feed\/home$/)
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("test-document-loads"))).toBe("1")
})