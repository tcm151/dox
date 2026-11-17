import { expect, it } from "vitest"
import type { AppSettings, Feedback } from "../../shared/types"
import { resolveClientAddress } from "../../server/utils/clientAddress"
import { extractId } from "../../shared/utils/records"
import { expectStatus, fetch, grabExampleServer, grabUser, uniqueTestIp } from "../utils/test-server"

const admin = await grabUser("admin")
const exampleServer = await grabExampleServer("default")
const author = exampleServer.users.sampleUser04

it("ignores forwarded addresses from untrusted peers", () => {
    expect(resolveClientAddress({
        socketAddress: "192.0.2.10",
        forwardedFor: "198.51.100.20",
        proxyConfig: "127.0.0.1",
    })).toBe("192.0.2.10")
})

it("enforces feedback settings and supports authored and anonymous submissions", async () => {
    const originalSettings = await admin.fetch<AppSettings>("/api/settings/default")
    const settingsId = extractId(originalSettings.id)
    if (!settingsId) throw new Error("App settings record has no ID.")

    const updateFeedback = (feedback: AppSettings["misc"]["feedback"]) => admin.fetchRaw(
        `/api/admin/settings/${settingsId}/update`,
        { method: "POST", body: { ...originalSettings, misc: { ...originalSettings.misc, feedback } } },
    )
    const feedbackIds: string[] = []

    try {
        expectStatus(await updateFeedback({ enabled: false, allowAnonymous: false }), 200)

        const authenticatedWhileDisabled = await author.fetchRaw("/api/feedback/submit", {
            method: "POST",
            headers: { "X-Forwarded-For": uniqueTestIp() },
            body: { content: `Disabled authenticated feedback ${Date.now()}` },
        })
        expectStatus(authenticatedWhileDisabled, 403, "authenticated feedback while disabled")

        const anonymousWhileDisabled = await fetch("/api/feedback/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Forwarded-For": uniqueTestIp() },
            body: JSON.stringify({ content: `Disabled anonymous feedback ${Date.now()}` }),
        })
        expectStatus(anonymousWhileDisabled, 403, "anonymous feedback while disabled")

        expectStatus(await updateFeedback({ enabled: true, allowAnonymous: false }), 200)

        const anonymousWithoutPermission = await fetch("/api/feedback/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Forwarded-For": uniqueTestIp() },
            body: JSON.stringify({ content: `Not allowed anonymous feedback ${Date.now()}` }),
        })
        expectStatus(anonymousWithoutPermission, 401, "anonymous feedback without permission")

        const authoredResponse = await author.fetchRaw<Feedback>("/api/feedback/submit", {
            method: "POST",
            headers: { "X-Forwarded-For": uniqueTestIp() },
            body: { content: `Authored feedback ${Date.now()}`, user: admin.user.id },
        })
        expectStatus(authoredResponse, 200, "authenticated feedback remains available")
        const authoredFeedback = authoredResponse._data!
        const authoredId = extractId(authoredFeedback.id)
        if (!authoredId) throw new Error("Authored feedback record has no ID.")
        feedbackIds.push(authoredId)
        expect(authoredFeedback.user).toBe(author.user.id)

        expectStatus(await updateFeedback({ enabled: true, allowAnonymous: true }), 200)

        const anonymousResponse = await fetch("/api/feedback/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Forwarded-For": uniqueTestIp() },
            body: JSON.stringify({ content: `Anonymous feedback ${Date.now()}`, user: author.user.id }),
        })
        expectStatus(anonymousResponse, 200, "anonymous feedback when enabled")
        const anonymousFeedback = await anonymousResponse.json() as Feedback
        const anonymousId = extractId(anonymousFeedback.id)
        if (!anonymousId) throw new Error("Anonymous feedback record has no ID.")
        feedbackIds.push(anonymousId)
        expect(anonymousFeedback.user).toBeUndefined()

        const feedbackList = await admin.fetch<Feedback[]>("/api/feedback")
        expect(feedbackList.find(item => item.id === authoredFeedback.id)?.user?.id).toBe(author.user.id)
        expect(feedbackList.find(item => item.id === anonymousFeedback.id)?.user).toBeUndefined()
    }
    finally {
        try {
            if (feedbackIds.length > 0) {
                await admin.query(feedbackIds.map(id => `DELETE feedback:${id};`).join("\n"))
            }
        }
        finally {
            expectStatus(await updateFeedback(originalSettings.misc.feedback), 200, "restore feedback settings")
        }
    }
})

it("rate limits anonymous feedback by the resolved client address", async () => {
    const originalSettings = await admin.fetch<AppSettings>("/api/settings/default")
    const settingsId = extractId(originalSettings.id)
    if (!settingsId) throw new Error("App settings record has no ID.")

    const updateFeedback = (feedback: AppSettings["misc"]["feedback"]) => admin.fetchRaw(
        `/api/admin/settings/${settingsId}/update`,
        { method: "POST", body: { ...originalSettings, misc: { ...originalSettings.misc, feedback } } },
    )
    const feedbackIds: string[] = []
    const clientIp = uniqueTestIp()

    try {
        expectStatus(await updateFeedback({ enabled: true, allowAnonymous: true }), 200)

        for (let attempt = 0; attempt < 5; attempt++) {
            const response = await fetch("/api/feedback/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Forwarded-For": clientIp },
                body: JSON.stringify({ content: `Rate-limited feedback ${Date.now()} ${attempt}` }),
            })
            expectStatus(response, 200, `anonymous feedback attempt ${attempt + 1}`)
            const feedback = await response.json() as Feedback
            const feedbackId = extractId(feedback.id)
            if (!feedbackId) throw new Error("Anonymous feedback record has no ID.")
            feedbackIds.push(feedbackId)
        }

        const limitedResponse = await fetch("/api/feedback/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Forwarded-For": clientIp },
            body: JSON.stringify({ content: `Rate-limited feedback ${Date.now()} sixth` }),
        })
        expectStatus(limitedResponse, 429, "sixth anonymous feedback attempt")
    }
    finally {
        try {
            if (feedbackIds.length > 0) {
                await admin.query(feedbackIds.map(id => `DELETE feedback:${id};`).join("\n"))
            }
        }
        finally {
            expectStatus(await updateFeedback(originalSettings.misc.feedback), 200, "restore feedback settings")
        }
    }
})
