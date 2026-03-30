import type { User } from "@@/shared/types"

export class ReferralManager {
    static async claimReferral(user: User, referral: string) {
        try {
            await new DatabaseQuery()
                .addSql(`
                    IF record::exists($recipient) AND $recipient != $claimant {
                        CREATE referralClaim SET
                            claimant = $claimant,
                            recipient = $recipient;
    
                        UPDATE $recipient SET
                            tokens += 1024;
    
                        CREATE notification SET
                            recipient = $recipient,
                            context = $context,
                            message = $message;
                    };
                `)
                .addRecord("recipient", `user:${referral}`)
                .addRecord("claimant", user.id)
                .addRecord("context", user.id)
                .addParameter("message", `**${user.name}** used your referral\n> You gained 1024 free tokens. Don't forget to thank them!\n`)
                .execute()
        }
        catch (error: any) {
            if (error.statusText?.includes("index `claimant_recipient` already contains")) {
                throw createError({
                    status: 400,
                    statusText: "This referral code has already been made."
                })
            }
            else {
                throw createError({
                    status: 400,
                    statusText: "Unable to validate referral claim.",
                    message: error.message,
                    stack: error.stack,
                })
            }
        }
    }                
}