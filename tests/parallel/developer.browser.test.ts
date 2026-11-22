import { expect, test } from "../utils/browser-fixtures"
import { displayBaseUrl, displayDeveloperValue } from "../../app/utils/developer-info"

test("formats unavailable values and removes credentials from base URLs", async () => {
    expect(displayDeveloperValue("")).toBe("Unavailable")
    expect(displayDeveloperValue("  ")).toBe("Unavailable")
    expect(displayDeveloperValue("main")).toBe("main")
    expect(displayBaseUrl(undefined)).toBe("Unavailable")
    expect(displayBaseUrl("ftp://example.com")).toBe("Unavailable")
    expect(displayBaseUrl("https://user:secret@example.com/forum?token=hidden#section"))
        .toBe("https://example.com/forum")
})

test("shows safe developer diagnostics and a copyable support summary", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/developer/info")

    const info = authenticatedPage.locator(".developer-info")
    const table = info.getByRole("table", { name: "Developer diagnostics" })
    await expect(table).toBeVisible()
    await expect(info.getByRole("table")).toHaveCount(1)
    await expect(table.getByRole("columnheader")).toHaveCount(2)
    for (const cell of await table.locator("th, td").all()) {
        await expect(cell).toHaveCSS("text-align", "left")
    }

    const row = (label: string) => table.getByRole("row").filter({ hasText: label })
    for (const label of ["Version", "Base URL", "Mode", "Build date", "Git commit", "Git ref"]) {
        const rowValue = row(label)
        await expect(rowValue).toBeVisible()
        await expect(rowValue.getByRole("rowheader", { name: label, exact: true })).toBeVisible()
        if (label === "Mode") {
            await expect(rowValue).toContainText(/Development|Production/)
        }
        else if (label === "Base URL") {
            await expect(rowValue.locator("td").last()).toHaveText(new URL(authenticatedPage.url()).origin)
        }
        else if (label === "Version") {
            await expect(rowValue.locator("td").last()).not.toBeEmpty()
        }
        else {
            await expect(rowValue.locator("td").last()).not.toBeEmpty()
        }
    }

    await expect(row("Version").getByRole("rowheader")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)")
    await expect(info).not.toContainText(/SMTP|password|database URL/i)

    await authenticatedPage.context().grantPermissions(["clipboard-read", "clipboard-write"])
    await info.getByRole("button", { name: "Copy Summary" }).click()
    await expect.poll(() => authenticatedPage.evaluate(() => navigator.clipboard.readText()))
        .toContain("ClassicForum support summary")
})
