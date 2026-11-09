import { expect, test } from "../utils/browser-fixtures"

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