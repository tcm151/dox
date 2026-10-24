import { expect, it } from "vitest"
import { fetch, grabUser } from "../test-server"
import type { User } from "../../shared/types"

it("reuses the saved admin session in a later test", async () => {
    const admin = await grabUser("admin")
    const response = await fetch("/api/profile/authenticate", {
        headers: { Authorization: admin.accessToken },
    })
    expect(response.status).toBe(200)

    const user = await response.json() as User
    expect(user.id).toBe(admin.user.id)
    expect(user.name).toBe(admin.user.name)
})