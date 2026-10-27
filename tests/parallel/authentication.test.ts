import { expect, it } from "vitest"
import { expectStatus, fetch, grabUser, testAdminCredentials } from "../test-server"
import type { User } from "../../shared/types"

it("reuses the admin session saved during sequential setup", async () => {
    const admin = await grabUser("admin")
    const user = await admin.fetch<User>("/api/profile/authenticate")
    expect(user.id).toBe(admin.user.id)
    expect(user.name).toBe(admin.user.name)
})

it("rejects a session token after logout", async () => {
    const loginResponse = await fetch("/api/profile/login", {
        headers: {
            Authorization: btoa(`${testAdminCredentials.name}:${testAdminCredentials.password}`),
        },
    })
    expectStatus(loginResponse, 200)
    const login = await loginResponse.json() as { tokens: { access: string } }
    const accessToken = login.tokens.access

    const authenticatedResponse = await fetch("/api/profile/authenticate", {
        headers: { Authorization: accessToken },
    })
    expectStatus(authenticatedResponse, 200)

    const logoutResponse = await fetch("/api/profile/logout", {
        method: "POST",
        headers: {
            Authorization: accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ clear: true }),
    })
    expectStatus(logoutResponse, 204, await logoutResponse.clone().text())

    const staleProfileResponse = await fetch("/api/profile/authenticate", {
        headers: { Authorization: accessToken },
    })
    expectStatus(staleProfileResponse, 401)

    const staleProtectedResponse = await fetch("/api/user/missing/save", {
        method: "POST",
        headers: { Authorization: accessToken },
    })
    expectStatus(staleProtectedResponse, 401)
})