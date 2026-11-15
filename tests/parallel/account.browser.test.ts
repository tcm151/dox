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

test("updates registration validation as fields change", async ({ page }) => {
    await page.goto("/register")

    const form = page.locator("article .form")
    const emailField = form.locator(".field").filter({ hasText: "Email" })
    const usernameField = form.locator(".field").filter({ hasText: "Username" })
    const passwordFields = form.locator(".field:has(input[type='password'])")

    await emailField.locator("input").fill("not-an-email")
    await expect(emailField).toHaveClass(/invalid/)
    await emailField.locator("input").fill("reader@example.invalid")
    await expect(emailField).not.toHaveClass(/invalid/)

    await usernameField.locator("input").fill("ab")
    await expect(usernameField).toHaveClass(/invalid/)

    await passwordFields.nth(0).locator("input").fill("valid-password")
    await passwordFields.nth(1).locator("input").fill("different-password")
    await expect(passwordFields.nth(1)).toHaveClass(/invalid/)
})