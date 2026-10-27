import { fetch, setup } from "@nuxt/test-utils/e2e"
import { $fetch, type FetchOptions, type FetchRequest, type ResponseType } from "ofetch"
import { inspect } from "node:util"
import { expect } from "vitest"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import type { User } from "../shared/types"
import { isObject, isValidUser } from "../shared/utils/validation"

export type TSession = {
    user: User
    accessToken: string
}

export type TExampleServer = {
    users: Record<string, TSession>
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

const apiFetch = $fetch.create({ baseURL: testServerUrl })

const userSessionDirectory = join(testDataDirectory, "state", "users")
const exampleServerDirectory = join(testDataDirectory, "state", "example-servers")

function getUserPath(key: string) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(key)) {
        throw new Error("Test user session keys must be 1-64 letters, numbers, underscores, or hyphens.")
    }

    return join(userSessionDirectory, `${key.toLowerCase()}.json`)
}

function getExampleServerPath(key: string) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(key)) {
        throw new Error("Example server keys must be 1-64 letters, numbers, underscores, or hyphens.")
    }

    return join(exampleServerDirectory, `${key.toLowerCase()}.json`)
}

export async function stashUser(key: string, session: TSession): Promise<void> {
    await mkdir(userSessionDirectory, { recursive: true })
    await writeFile(getUserPath(key), JSON.stringify(session), "utf8")
}

export async function grabUser(key: string) {
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

    return withSessionMethods(session as TSession)
}

export async function stashExampleServer(key: string, exampleServer: TExampleServer): Promise<void> {
    const exampleServerPath = getExampleServerPath(key)
    await mkdir(dirname(exampleServerPath), { recursive: true })
    await writeFile(exampleServerPath, JSON.stringify(exampleServer), "utf8")
}

export async function grabExampleServer(key: string) {
    const exampleServerPath = getExampleServerPath(key)
    let contents: string
    try {
        contents = await readFile(exampleServerPath, "utf8")
    }
    catch (error) {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") {
            throw new Error(`The example server "${key}" has not been seeded yet.`)
        }
        throw error
    }

    const exampleServer: unknown = JSON.parse(contents)
    if (!isValidExampleServer(exampleServer)) {
        throw new Error(`The example server "${key}" has an invalid shape.`)
    }

    return {
        users: Object.fromEntries(
            Object.entries(exampleServer.users).map(([userKey, session]) => [userKey, withSessionMethods(session)]),
        ),
    }
}

function withSessionMethods(session: TSession) {
    const fetch = apiFetch.create({ headers: { Authorization: session.accessToken } })
    const fetchRaw = <T = unknown, R extends ResponseType = "json">(
        request: FetchRequest,
        options: FetchOptions<R> = {},
    ) => fetch.raw<T, R>(request, {
        ...options,
        ignoreResponseError: options.ignoreResponseError ?? true,
    })

    return {
        ...session,
        fetch,
        fetchRaw,
        query: <T = unknown>(sql: string) => fetch<T>("/api/developer/database/query", {
            method: "POST",
            body: { query: sql },
        }),
    }
}

function isValidExampleServer(value: unknown): value is TExampleServer {
    if (!isObject(value)) return false

    const users = value.users
    return isObject(users)
        && Object.values(users).length > 0
        && Object.values(users).every(isValidSession)
}

function isValidSession(value: unknown): value is TSession {
    if (!isObject(value)) return false

    const session = value as Record<string, unknown>
    return typeof session.accessToken === "string" && isValidUser(session.user)
}

export { fetch }
export const testAdminCredentials = { name: adminName, password: adminPassword }

export function expectStatus(
    response: { status: number, _data?: unknown },
    expectedStatus: number,
    message?: string,
) {
    const details = response.status === expectedStatus
        ? message
        : message ?? (response._data === undefined ? undefined : inspect(response._data, { colors: false, depth: 5 }))
    expect(response.status, details).toBe(expectedStatus)
}
