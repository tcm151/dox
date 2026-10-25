import { expect, it } from "vitest"
import { fetch, grabUser, testAdminCredentials } from "../test-server"
import type { User } from "../../shared/types"

it("reuses the admin session saved during sequential setup", async () => {
    const admin = await grabUser("admin")
    const response = await fetch("/api/profile/authenticate", {
        headers: { Authorization: admin.accessToken },
    })
    expect(response.status).toBe(200)

    const user = await response.json() as User
    expect(user.id).toBe(admin.user.id)
    expect(user.name).toBe(admin.user.name)
})

it("rejects a session token after logout", async () => {
    const loginResponse = await fetch("/api/profile/login", {
        headers: {
            Authorization: btoa(`${testAdminCredentials.name}:${testAdminCredentials.password}`),
        },
    })
    expect(loginResponse.status).toBe(200)
    const login = await loginResponse.json() as { tokens: { access: string } }
    const accessToken = login.tokens.access

    const authenticatedResponse = await fetch("/api/profile/authenticate", {
        headers: { Authorization: accessToken },
    })
    expect(authenticatedResponse.status).toBe(200)

    const logoutResponse = await fetch("/api/profile/logout", {
        method: "POST",
        headers: {
            Authorization: accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ clear: true }),
    })
    expect(logoutResponse.status, await logoutResponse.clone().text()).toBe(204)

    const staleProfileResponse = await fetch("/api/profile/authenticate", {
        headers: { Authorization: accessToken },
    })
    expect(staleProfileResponse.status).toBe(401)

    const staleProtectedResponse = await fetch("/api/user/missing/save", {
        method: "POST",
        headers: { Authorization: accessToken },
    })
    expect(staleProtectedResponse.status).toBe(401)
})