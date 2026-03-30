export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)    
    const { referral } = await readBody<{ referral?: string }>(event)

    if (!referral) {
        throw createError({
            status: 400,
            statusText: "Unable to validate referral claim."
        })
    }

    await ReferralManager.claimReferral(auth, referral)
})
