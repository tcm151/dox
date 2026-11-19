import { expect, test } from "../utils/browser-fixtures"

test("keeps feedback available after a failed submission and allows retry", async ({ authenticatedPage }) => {
    let attempts = 0
    let signalFirstRequest = () => {}
    let releaseFirstResponse = () => {}
    const firstRequestStarted = new Promise<void>(resolve => { signalFirstRequest = resolve })
    const firstResponseGate = new Promise<void>(resolve => { releaseFirstResponse = resolve })
    const submittedContent: string[] = []

    await authenticatedPage.route("**/api/feedback/submit", async (route) => {
        attempts += 1
        submittedContent.push(route.request().postDataJSON().content)

        if (attempts === 1) {
            signalFirstRequest()
            await firstResponseGate
            await route.fulfill({
                status: 500,
                contentType: "application/json",
                headers: { "x-request-id": "feedback-retry-request" },
                body: JSON.stringify({ statusCode: 500, statusMessage: "Temporary feedback failure" }),
            })
            return
        }

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({}),
        })
    })

    await authenticatedPage.goto("/contact")
    const content = `Retryable feedback ${Date.now()}`
    const textarea = authenticatedPage.locator("textarea")
    const submit = authenticatedPage.getByRole("button", { name: "Submit" })

    await submit.click()
    await expect(authenticatedPage.locator(".hint.warning")).toContainText("You can't submit nothing.")
    expect(attempts).toBe(0)

    await textarea.fill(content)
    await submit.click()
    await firstRequestStarted
    await expect(submit).toBeDisabled()
    await expect(textarea).toHaveValue(content)
    await submit.dispatchEvent("click")
    expect(attempts).toBe(1)

    releaseFirstResponse()
    await expect(submit).toBeEnabled()
    await expect(textarea).toHaveValue(content)
    await expect(authenticatedPage.locator(".hint.danger")).toBeVisible()
    await expect(authenticatedPage.locator('a.hint-message[href*="requestId=feedback-retry-request"]')).toBeVisible()

    await submit.click()
    await expect(textarea).toHaveValue("")
    expect(attempts).toBe(2)
    expect(submittedContent).toEqual([content, content])
})