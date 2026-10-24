import { expect, it } from "vitest"
import { fetch, stashUser, testAdminCredentials } from "../test-server"
import type { User } from "../../shared/types"

type LoginResponse = {
    tokens: { access: string }
    user: User
}

it("logs in with the configured default account", async () => {
    const response = await fetch("/api/profile/login", {
        headers: {
            Authorization: btoa(`${testAdminCredentials.name}:${testAdminCredentials.password}`),
        },
    })
    if (!response.ok) {
        throw new Error(`Login failed with status ${response.status}: ${await response.text()}`)
    }

    const result = await response.json() as LoginResponse
    expect(result.tokens.access).toBeTruthy()
    expect(result.user.name).toBe(testAdminCredentials.name)

    const profileResponse = await fetch("/api/profile/authenticate", {
        headers: { Authorization: result.tokens.access },
    })
    expect(profileResponse.status).toBe(200)

    const profile = await profileResponse.json() as User
    expect(profile.id).toBe(result.user.id)

    await stashUser("admin", {
        user: result.user,
        accessToken: result.tokens.access,
    })
})