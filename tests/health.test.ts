import { expect, it } from "vitest"
import { fetch, getServerLogs, setup } from "@nuxt/test-utils/e2e"

type HealthReport = {
    app: string
    database: string
}

const testDataDirectory = process.env.CLASSICFORUM_TEST_DATA_DIRECTORY
if (!testDataDirectory?.startsWith(".test-output-") || testDataDirectory.includes("..")) {
    throw new Error("Run integration tests with `yarn test` to create an isolated data directory.")
}

await setup({
    rootDir: process.cwd(),
    server: true,
    env: {
        NUXT_DATA_PATH: `${testDataDirectory}/media`,
        NUXT_SURREAL_INFO_TYPE: "embedded",
        NUXT_SURREAL_INFO_URL: `rocksdb://${testDataDirectory}/database/default.db`,
        NUXT_SURREAL_INFO_NAMESPACE: "classicforum_test",
        NUXT_SURREAL_INFO_DATABASE: "integration_test",
        NUXT_SURREAL_ADMIN_EMAIL: "test@example.invalid",
        NUXT_SURREAL_ADMIN_NAME: "TestAdmin",
        NUXT_SURREAL_ADMIN_PASSWORD: "integration-test-password",
    },
})

it("starts Nuxt with a ready embedded SurrealDB instance", async () => {
    const deadline = Date.now() + 60_000
    let lastHealth: HealthReport | undefined

    while (Date.now() < deadline) {
        const response = await fetch("/api/health")
        lastHealth = await response.json() as HealthReport

        if (response.ok && lastHealth.app === "ready" && lastHealth.database === "ready") return
        if (lastHealth.app === "failed") break

        await new Promise(resolve => setTimeout(resolve, 250))
    }

    throw new Error(
        `Test server did not become ready. Last health: ${JSON.stringify(lastHealth)}\n${getServerLogs().join("\n")}`,
    )
})