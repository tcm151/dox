import type { AccountConfirmation, AppSettings } from "@@/shared/types"
import { SettingsManager } from "@@/server/utils/SettingsManager"
import { rateLimiter } from "@@/server/utils/RateLimiter"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const account = event.context.account
    const email = account.email

    if (!email) {
        throw createError({
            status: 401,
            statusText: "Unable to verify request email."
        })
    }

    if (auth.traits.includes("confirmed")) {
        throw createError({
            status: 409,
            statusText: "This account is already confirmed."
        })
    }

    const confirmationSendPath = "/api/profile/confirm/send"
    rateLimiter.enforce(event, [
        { key: account.id, path: confirmationSendPath, scope: "account" },
        { key: email.toLowerCase(), path: confirmationSendPath, scope: "recipient" },
    ])

    const settings = await SettingsManager.get()
    const pendingConfirmations = await new DatabaseQuery()
        .addSql(`
            SELECT id
            FROM accountConfirmation
            WHERE account = $account
            AND used = false
            AND expired = false
            ORDER BY time DESC
            LIMIT 1
        `)
        .addRecord("account", account.id)
        .queryAll<Pick<AccountConfirmation, "id">>()

    let confirmationId = pendingConfirmations[0]?.id
    if (confirmationId) {
        await new DatabaseQuery()
            .addSql("UPDATE ONLY $confirmation SET time = time::now();")
            .addRecord("confirmation", confirmationId)
            .execute()
    }
    else {
        const confirmation = await new DatabaseQuery()
            .addSql(`
                CREATE accountConfirmation SET
                    account = $account
            `)
            .addRecord("account", account.id)
            .queryOne<AccountConfirmation>()
        confirmationId = confirmation.id
    }

    const { public: { baseUrl } } = useRuntimeConfig()
    let template = await useStorage("assets:server").getItem("templates/confirm-account.html") as string
    template = template.replace("{{user.email}}", email)
    template = template.replace("{{user.name}}", auth.name)
    template = template.replace("{{confirmLink}}", `${baseUrl}/profile?confirmation=${confirmationId}`)
    template = template.replace("{{reportLink}}", `${baseUrl}/profile?report=${confirmationId}`)
    template = template.replace("{{supportEmail}}", settings.email.support ?? "support@example.com")

    try {
        return await sendEmail({
            recipient: email,
            subject: `Confirm Account: ${email}`,
            text: "account verification.",
            html: template
        })
    }
    catch (error) {
        console.error("Failed to send account confirmation email.", error)
        const retryAfter = rateLimiter.setRetryAfter(event, [
            { key: account.id, path: confirmationSendPath, scope: "account" },
            { key: email.toLowerCase(), path: confirmationSendPath, scope: "recipient" },
        ])
        throw createError({
            status: 503,
            statusText: "Confirmation email could not be sent. Please wait before trying again.",
            data: { retryAfter }
        })
    }
})
