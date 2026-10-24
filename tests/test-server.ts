import { fetch, setup } from "@nuxt/test-utils/e2e"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { User } from "../shared/types"

export type TSession = {
    user: User
    accessToken: string
}

const testDataDirectory = process.env.CLASSICFORUM_TEST_DATA_DIRECTORY
const testServerUrl = process.env.CLASSICFORUM_TEST_SERVER_URL
const adminName = process.env.CLASSICFORUM_TEST_ADMIN_NAME
const adminPassword = process.env.CLASSICFORUM_TEST_ADMIN_PASSWORD

if (!testDataDirectory?.startsWith(".test-output-") || testDataDirectory.includes("..") || !testServerUrl || !adminName || !adminPassword) {
    throw new Error("Run integration tests with `yarn test` to start the isolated test app.")
}

await setup({
    rootDir: process.cwd(),
    host: testServerUrl,
})

const userSessionDirectory = join(testDataDirectory, "state", "users")

function getUserPath(key: string) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(key)) {
        throw new Error("Test user session keys must be 1-64 letters, numbers, underscores, or hyphens.")
    }

    return join(userSessionDirectory, `${key.toLowerCase()}.json`)
}

export async function stashUser(key: string, session: TSession): Promise<void> {
    await mkdir(userSessionDirectory, { recursive: true })
    await writeFile(getUserPath(key), JSON.stringify(session), "utf8")
}

export async function grabUser(key: string): Promise<TSession> {
    let contents: string
    try {
        contents = await readFile(getUserPath(key), "utf8")
    }
    catch (error) {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") {
            throw new Error(`No test user session has been stored for "${key}".`)
        }
        throw error
    }

    const session: unknown = JSON.parse(contents)
    if (!isValidSession(session)) {
        throw new Error(`Stored test user session "${key}" has an invalid shape.`)
    }

    return session as TSession
}

function isValidSession(value: unknown): value is TSession {
    if (typeof value !== "object" || value === null) return false

    const session = value as Record<string, unknown>
    return typeof session.accessToken === "string" && isValidUser(session.user)
}

function isValidUser(value: unknown): value is User {
    if (typeof value !== "object" || value === null) return false

    const user = value as Record<string, unknown>
    return typeof user.id === "string"
        && typeof user.name === "string"
        && typeof user.score === "number"
        && typeof user.visits === "number"
        && typeof user.dateJoined === "string"
        && typeof user.tokens === "number"
        && isStringArray(user.topics)
        && isStringArray(user.followers)
        && isStringArray(user.following)
        && isVoteCounts(user.votes)
        && isRoleArray(user.roles)
        && isTraitArray(user.traits)
        && (user.link === undefined || typeof user.link === "string")
        && (user.description === undefined || typeof user.description === "string")
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(item => typeof item === "string")
}

function isVoteCounts(value: unknown): value is User["votes"] {
    if (typeof value !== "object" || value === null) return false

    const votes = value as Record<string, unknown>
    return isStringArray(votes.positive)
        && isStringArray(votes.misleading)
        && isStringArray(votes.negative)
}

function isRoleArray(value: unknown): value is User["roles"] {
    return Array.isArray(value)
        && value.every(role => role === "admin" || role === "developer" || role === "moderator")
}

function isTraitArray(value: unknown): value is User["traits"] {
    return Array.isArray(value)
        && value.every(trait => trait === "confirmed" || trait === "verified")
}

export { fetch }
export const testAdminCredentials = { name: adminName, password: adminPassword }