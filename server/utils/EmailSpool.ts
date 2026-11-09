import type { Record } from "@@/shared/types"
import { SettingsManager } from "@@/server/utils/SettingsManager"
import * as nodemailer from "nodemailer"

export interface Email extends Record {
    status: string
    time: string
    attempts: number
    recipient: string
    subject: string
    text?: string
    html: string
}

type SettingsProvider = Pick<typeof SettingsManager, "get">

export class EmailSpool {
    private client: nodemailer.Transporter
    private settings: SettingsProvider

    constructor(settingsManager: SettingsProvider) {
        const { smtp } = useRuntimeConfig()

        this.settings = settingsManager
        this.client = nodemailer.createTransport({
            host: smtp.host,
            port: Number.parseInt(smtp.port),
            secure: false,
            auth: {
                user: smtp.user,
                pass: smtp.pass,
            }
        })
    }

    async sendEmail(email: Email) {
        const { smtp } = useRuntimeConfig()
        return await this.client.sendMail({
            from: smtp.title,
            to: email.recipient,
            subject: email.subject,
            text: email.text ?? 'Oops.',
            html: email.html
        })
    }

    async getPending() {
        const batchLimit = await this.getRemainingDailyAmount()
        if (batchLimit === 0) return []

        return new DatabaseQuery()
            .addSql(`
                SELECT *
                FROM scheduledEmail
                WHERE status IN ["pending", "retrying"]
                ORDER BY time ASC
                LIMIT $batch
            `)
            .addParameter("batch", batchLimit)
            .queryAll<Email>()
    }

    async getRemainingDailyAmount() {
        const settings = (await this.settings.get()).email.spool
        const sentToday = await new DatabaseQuery()
            .addSql(`
                SELECT VALUE COUNT() AS count
                FROM scheduledEmail
                WHERE status = "sent"
                AND time::round(time, 1d) = time::round(time::now(), 1d)
            `)
            .queryValue<number>()

        const remainingDailyAmount = Math.max(0, settings.dailyLimit - (sentToday ?? 0))
        return Math.max(0, Math.min(settings.batchLimit, remainingDailyAmount))
    }

    async spool(): Promise<void> {
        const pending = await this.getPending()
        if (pending.length === 0) return

        const maxRetries = (await this.settings.get()).email.spool.maxRetries
        for (const email of pending) {
            try {
                await this.sendEmail(email)
                await new DatabaseQuery()
                    .addSql(`
                        UPDATE $email SET
                            status = "sent",
                            time = time::now(),
                            attempts += 1
                    `)
                    .addParameter("email", email.id)
                    .execute()
            }
            catch (error: any) {
                email.status = (email.attempts >= maxRetries)
                    ? "failed"
                    : "retrying"

                await new DatabaseQuery()
                    .addSql(`
                        UPDATE $email SET
                            status = $status,
                            attempts += 1
                    `)
                    .addParameter("email", email.id)
                    .addParameter("status", email.status)
                    .execute()
            }
        }
    }
}