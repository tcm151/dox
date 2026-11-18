import { expect, it } from "vitest"
import type { AppSettings } from "../../shared/types"
import { applyMigrations, applySchemaFromTag, getPreviousReleaseTag, useSurrealSandbox } from "../../scripts/surreal-explore.mjs"
import { fetch, grabUser } from "../utils/test-server"

const admin = await grabUser("admin")

it("applies every migration after the previous tagged release", async () => {
    const healthResponse = await fetch("/api/health")
    const health = await healthResponse.json() as { version: string }
    const previousReleaseTag = getPreviousReleaseTag(health.version)

    const result = await useSurrealSandbox(async (database) => {
        await applySchemaFromTag(database, previousReleaseTag)
        const baseline = await database.query("SELECT VALUE version FROM migration;")
        const appliedMigrations = await applyMigrations(database, previousReleaseTag, health.version)
        const versions = await database.query("SELECT VALUE version FROM migration ORDER BY time ASC;")
        return {
            baselineVersion: baseline[0]?.[0],
            recordedVersions: versions[0] ?? [],
            appliedMigrations,
        }
    })

    expect(result.baselineVersion).toBeDefined()
    expect(result.recordedVersions).toEqual([result.baselineVersion, ...result.appliedMigrations])
}, 60_000)

it("defaults existing and new profile privacy settings to public", async () => {
    const healthResponse = await fetch("/api/health")
    const health = await healthResponse.json() as { version: string }
    const previousReleaseTag = getPreviousReleaseTag(health.version)
    const previousReleaseVersion = previousReleaseTag.replace(/^v/, "")

    const result = await useSurrealSandbox(async (database) => {
        await applySchemaFromTag(database, previousReleaseTag)
        await database.query(`
            CREATE user:privacy_existing SET name = "privacy_existing";
            CREATE userSettings:privacy_existing SET user = user:privacy_existing;
        `)
        await applyMigrations(database, previousReleaseVersion, health.version)

        const existing = await database.query(
            "SELECT privacy.profile FROM userSettings WHERE user = user:privacy_existing;",
        )
        await database.query(`
            CREATE user:privacy_new SET name = "privacy_new";
            CREATE userSettings:privacy_new SET user = user:privacy_new;
        `)
        const created = await database.query(
            "SELECT privacy.profile FROM userSettings WHERE user = user:privacy_new;",
        )
        return {
            existing: existing[0]?.[0]?.privacy?.profile,
            created: created[0]?.[0]?.privacy?.profile,
        }
    })

    expect(result).toEqual({ existing: "public", created: "public" })
}, 60_000)

it("replays the current migration for an authorized developer", async () => {
    const result = await admin.fetch<{ version: string }>("/api/developer/database/replay", { method: "POST" })
    const healthResponse = await fetch("/api/health")
    const health = await healthResponse.json() as { version: string }
    expect(result.version).toBe(health.version)

    const versions = await admin.query<Array<Array<{ version: string }>>>("SELECT version FROM migration ORDER BY time DESC LIMIT 1;")
    expect(versions[0]?.[0]?.version).toBe(health.version)

    const settings = await admin.fetch<AppSettings>("/api/settings/default")
    expect(settings.email.spool).toEqual({
        dailyLimit: 100,
        batchLimit: 10,
        maxRetries: 3,
    })
    expect(settings.topics).toEqual({
        perSubmission: 3,
        restrict: false,
        allowed: [],
    })
})