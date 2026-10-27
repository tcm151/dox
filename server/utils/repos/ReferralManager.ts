import type { User } from "@@/shared/types"
import { NotificationManager } from "./NotificationManager"

export class ReferralManager {
    static async validateReferral(referral: string) {
        if (typeof referral !== "string" || referral.trim() === "") {
            throw createError({
                status: 400,
                statusText: "Enter a valid referral code."
            })
        }

        const recipient = `user:${referral.trim()}`
        if (!parseRecordId(recipient)) {
            throw createError({
                status: 400,
                statusText: "The referral code is invalid."
            })
        }

        const users = await new DatabaseQuery()
            .addSql(`
                SELECT VALUE id
                FROM user
                WHERE id = $recipient LIMIT 1;
            `)
            .addRecord("recipient", recipient)
            .queryAll<string>()

        if (users.length === 0) {
            throw createError({
                status: 400,
                statusText: "The referral code does not belong to an existing user."
            })
        }
    }

    static async claimReferral(user: User, referral: string): Promise<string> {
        await this.validateReferral(referral)
        const recipient = `user:${referral.trim()}`

        if (recipient === user.id) {
            throw createError({
                status: 400,
                statusText: "You cannot redeem your own referral code."
            })
        }

        const existingClaims = await new DatabaseQuery()
            .addSql(`
                SELECT VALUE id
                FROM referralClaim
                WHERE claimant = $claimant LIMIT 1;
            `)
            .addRecord("claimant", user.id)
            .queryAll<string>()

        if (existingClaims.length > 0) {
            return "already-claimed"
        }

        try {
            await new DatabaseQuery()
                .addSql(`
                    IF record::exists($recipient) AND $recipient != $claimant {
                        CREATE referralClaim SET
                            claimant = $claimant,
                            recipient = $recipient;
    
                        UPDATE $recipient SET
                            tokens += 1024;
                    };
                `)
                .addTransaction()
                .addRecord("recipient", recipient)
                .addRecord("claimant", user.id)
                .execute()
        }
        catch (error: any) {
            if (error.message?.includes("index `claimant` already contains")) {
                return "already-claimed"
            }
            throw createError({
                status: 400,
                statusText: "Unable to complete the referral claim.",
                message: error.message,
                stack: error.stack,
            })
        }

        await NotificationManager.send({
            recipient,
            context: user.id,
            message: `**${user.name}** used your referral\n> You gained 1024 free tokens. Don't forget to thank them!\n`,
        })

        return "claimed"
    }                
}