import { expect, it, vi } from "vitest"
import type { AppSettings } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { stubDatabaseQuery } from "../utils/test-database-query"
import { expectStatus, grabUser } from "../utils/test-server"

const admin = await grabUser("admin")
const { EmailSpool } = await import("../../server/utils/EmailSpool")

type EmailFixture = {
    id: string
    status: string
    time: string
    attempts: number
    recipient: string
    subject: string
    text: string
    html: string
}

type SpoolUpdate = {
    email: unknown
    status: string | undefined
    attemptsIncremented: boolean
}

function updateSettings(settings: AppSettings) {
    return admin.fetchRaw(`/api/admin/settings/${extractId(settings.id)}/update`, {
        method: "POST",
        body: settings,
    })
}

function stubSpoolDatabase(email: EmailFixture) {
    const updates: SpoolUpdate[] = []

    vi.stubGlobal("useRuntimeConfig", () => ({
        smtp: {
            host: "127.0.0.1",
            port: "2525",
            user: "",
            pass: "",
            title: "test@example.com",
        },
    }))
    stubDatabaseQuery({
        queryValue: () => 0,
        queryAll: () => [email],
        execute: ({ sql, parameters }) => {
            const status = typeof parameters.status === "string"
                ? parameters.status
                : sql.includes('status = "sent"') ? "sent" : undefined
            updates.push({
                email: parameters.email,
                status,
                attemptsIncremented: sql.includes("attempts += 1"),
            })
        },
    })

    return updates
}

function createEmail(attempts: number): EmailFixture {
    return {
        id: "scheduledEmail:spool-transition-test",
        status: "retrying",
        time: "2026-11-09T00:00:00Z",
        attempts,
        recipient: "recipient@example.com",
        subject: "Spool transition test",
        text: "test",
        html: "<p>test</p>",
    }
}

async function createSpoolHarness(email: EmailFixture, maxRetries = 3) {
    const appSettings = await admin.fetch<AppSettings>("/api/settings/default")
    const settings = {
        ...appSettings,
        email: {
            ...appSettings.email,
            spool: {
                ...appSettings.email.spool,
                maxRetries,
            },
        },
    }
    const settingsManager = { get: vi.fn(async () => settings) }
    const updates = stubSpoolDatabase(email)
    return { spool: new EmailSpool(settingsManager), updates }
}

it("persists spool limits through the admin app settings workflow", async () => {
    const originalSettings = await admin.fetch<AppSettings>("/api/settings/default")
    const spool = {
        dailyLimit: 100,
        batchLimit: 10,
        maxRetries: 3,
    }
    const updatedSettings: AppSettings = {
        ...originalSettings,
        email: {
            ...originalSettings.email,
            spool,
        },
    }

    try {
        expectStatus(await updateSettings(updatedSettings), 200)

        const savedSettings = await admin.fetch<AppSettings>("/api/settings/default")
        expect(savedSettings.email.spool).toEqual(spool)
    }
    finally {
        expectStatus(await updateSettings(originalSettings), 200, "restore app settings")
    }
})

it("loads persisted spool settings through its injected settings manager", async () => {
    const settings = await admin.fetch<AppSettings>("/api/settings/default")
    const settingsManager = { get: vi.fn(async () => settings) }
    let sentToday = 97
    let selectedBatch = 0
    let pendingQueries = 0

    class TestDatabaseQuery {
        addSql() {
            return this
        }

        addParameter(name: string, value: number) {
            if (name === "batch") selectedBatch = value
            return this
        }

        async queryValue<T>() {
            return sentToday as T
        }

        async queryAll<T>() {
            pendingQueries++
            return [] as T[]
        }
    }

    vi.stubGlobal("useRuntimeConfig", () => ({
        smtp: {
            host: "127.0.0.1",
            port: "2525",
            user: "",
            pass: "",
            title: "test@example.com",
        },
    }))
    vi.stubGlobal("DatabaseQuery", TestDatabaseQuery)

    try {
        const spool = new EmailSpool(settingsManager)

        expect(await spool.getPending()).toEqual([])
        expect(settingsManager.get).toHaveBeenCalledOnce()
        expect(selectedBatch).toBe(3)
        expect(pendingQueries).toBe(1)

        sentToday = 100
        expect(await spool.getPending()).toEqual([])
        expect(settingsManager.get).toHaveBeenCalledTimes(2)
        expect(pendingQueries).toBe(1)
    }
    finally {
        vi.unstubAllGlobals()
    }
})

it("marks successfully sent emails and increments their attempts", async () => {
    const email = createEmail(0)
    const { spool, updates } = await createSpoolHarness(email)

    try {
        vi.spyOn(spool, "sendEmail").mockResolvedValue(
            {} as Awaited<ReturnType<typeof spool.sendEmail>>,
        )

        await spool.spool()

        expect(updates).toEqual([{
            email: email.id,
            status: "sent",
            attemptsIncremented: true,
        }])
    }
    finally {
        vi.unstubAllGlobals()
    }
})

it("requeues failed emails while retries remain", async () => {
    const email = createEmail(2)
    const { spool, updates } = await createSpoolHarness(email, 3)

    try {
        vi.spyOn(spool, "sendEmail").mockRejectedValue(new Error("SMTP unavailable"))

        await spool.spool()

        expect(updates).toEqual([{
            email: email.id,
            status: "retrying",
            attemptsIncremented: true,
        }])
    }
    finally {
        vi.unstubAllGlobals()
    }
})

it("marks failed emails terminal after the configured retries are exhausted", async () => {
    const email = createEmail(3)
    const { spool, updates } = await createSpoolHarness(email, 3)

    try {
        vi.spyOn(spool, "sendEmail").mockRejectedValue(new Error("SMTP unavailable"))

        await spool.spool()

        expect(updates).toEqual([{
            email: email.id,
            status: "failed",
            attemptsIncremented: true,
        }])
    }
    finally {
        vi.unstubAllGlobals()
    }
})
