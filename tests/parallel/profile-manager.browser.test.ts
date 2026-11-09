import { expect, test } from "../utils/browser-fixtures"

test("opens and closes the Profiles window from authenticated navigation", async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator("nav").getByRole("link", { name: "Submit" })).toBeVisible()
    await expect(authenticatedPage.locator("nav").getByRole("link", { name: "Inbox" })).toBeVisible()

    await authenticatedPage.locator("nav").getByRole("link", { name: /TestAdmin/ }).click({ button: "right" })
    await expect(authenticatedPage.getByRole("heading", { name: "Profiles" })).toBeVisible()
    await expect(authenticatedPage.getByText("New Login", { exact: true })).toBeVisible()
    await authenticatedPage.locator("main.window button.close").click()
    await expect(authenticatedPage.getByRole("heading", { name: "Profiles" })).toBeHidden()
})