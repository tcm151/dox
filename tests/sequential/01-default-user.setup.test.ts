import { expect, it } from "vitest"
import { expectStatus, fetch, stashUser, testAdminCredentials } from "../utils/test-server"
import type { Profile } from "../../shared/types"

type LoginResponse = {
    tokens: { access: string }
    user: Profile
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
    expectStatus(profileResponse, 200)

    const profile = await profileResponse.json() as Profile
    expect(profile.id).toBe(result.user.id)
    expect(profile.topics).toEqual(result.user.topics)
    expect(profile.topics).toMatchObject({ following: expect.any(Array), moderates: expect.any(Array) })
    expect(profile.votes.awards).toEqual([])
    expect(profile.votes.saves).toEqual([])

    await stashUser("admin", {
        user: result.user,
        accessToken: result.tokens.access,
    })
})