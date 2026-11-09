import { expect, test } from "../utils/browser-fixtures"

test("renders and navigates the home and posts feeds with shared sample data", async ({ page, exampleServer }) => {
    expect(exampleServer.users.postAuthor.user.name).toMatch(/^Example/)
    await page.goto("/feed/home")

    await expect(page.getByText("Browser suite sample post", { exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "New" })).toBeVisible()
    await page.getByRole("button", { name: "Hot" }).click()
    await expect(page.getByRole("button", { name: "Hot" })).toHaveClass(/selected/)

    await page.getByRole("link", { name: /Posts/ }).click()
    await expect(page).toHaveURL(/\/feed\/posts$/)
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible()
    await expect(page.getByText("Browser suite sample post", { exact: true })).toBeVisible()
})