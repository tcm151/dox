import { expect, it } from "vitest"
import { fetch, testAdminCredentials } from "../test-server"

type UserSummary = {
    name: string
    roles: string[]
}

it("returns a valid database response", async () => {
    const response = await fetch("/api/user")
    expect(response.status).toBe(200)

    const users = await response.json() as UserSummary[]
    expect(Array.isArray(users)).toBe(true)

    const defaultUser = users.find(user => user.name === testAdminCredentials.name)
    expect(defaultUser).toBeDefined()
    expect(defaultUser?.roles).toEqual(expect.arrayContaining(["admin", "moderator", "developer"]))
})