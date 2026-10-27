import { expect, it } from "vitest"
import { expectStatus, fetch } from "../test-server"

it("rate limits referral claims outside the authentication routes", async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
        const response = await fetch("/api/profile/referral", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
        })
        expectStatus(response, 401)
    }

    const limitedResponse = await fetch("/api/profile/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
    })
    expectStatus(limitedResponse, 429)
})