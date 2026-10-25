import { expect, it } from "vitest"
import { fetch, grabUser, stashExampleServer, type TSession, type TExampleServer } from "../test-server"

const exampleUserKeys = [
    "awardSender",
    "awardTarget",
    "subscriber",
    "postAuthor",
    "threadAuthor",
    "commentAuthor",
    "sampleUser01",
    "sampleUser02",
    "sampleUser03",
    "sampleUser04",
]
const suffix = Date.now().toString()

async function createTestUser(username: string): Promise<TSession> {
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
        throw new Error("Test usernames must be 3-32 letters, numbers, or underscores.")
    }

    const admin = await grabUser("admin")
    const email = `${username.toLowerCase()}@example.invalid`
    const accessToken = `session:test_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const seedResponse = await fetch("/api/developer/database/query", {
        method: "POST",
        headers: {
            Authorization: admin.accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query: `
                RETURN {
                    LET $user = (
                        CREATE ONLY user SET
                            name = "${username}"
                    );
                    LET $account = (
                        CREATE ONLY account SET
                            user = $user.id,
                            email = "${email}",
                            password = crypto::argon2::generate("integration-test-password")
                    );
                    CREATE ONLY ${accessToken} SET
                        account = $account.id;
                };
            `,
        }),
    })
    if (!seedResponse.ok) {
        throw new Error(`Failed to create test user: ${await seedResponse.text()}`)
    }

    const profileResponse = await fetch("/api/profile/authenticate", {
        headers: { Authorization: accessToken },
    })
    if (!profileResponse.ok) {
        throw new Error(`Failed to authenticate test user: ${await profileResponse.text()}`)
    }

    return {
        user: await profileResponse.json() as TSession["user"],
        accessToken,
    }
}

it("seeds reusable example users", async () => {
    const users: Record<string, TSession> = {}

    for (const [index, key] of exampleUserKeys.entries()) {
        const username = `Example${suffix}${index}`
        users[key] = {
            ...await createTestUser(username),
        }
    }

    const exampleServer: TExampleServer = {
        users,
    }
    await stashExampleServer("default", exampleServer)
})