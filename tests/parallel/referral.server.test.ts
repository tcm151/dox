import { randomUUID } from "node:crypto"
import { expect, it } from "vitest"
import type { User } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { expectStatus, fetch, grabUser, uniqueTestIp } from "../utils/test-server"

interface ReferralTestAccount {
    accessToken: string
    user: User
}

const admin = await grabUser("admin")
const password = "ReferralTest-password"

async function createAccount(): Promise<ReferralTestAccount> {
    const username = `Referral${randomUUID().replaceAll("-", "").slice(0, 12)}`
    const registerResponse = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Forwarded-For": uniqueTestIp() },
        body: JSON.stringify({
            username,
            email: `${username.toLowerCase()}@example.invalid`,
            password,
        }),
    })
    expectStatus(registerResponse, 200, "referral account registration stage")
    const accessToken = await registerResponse.text()
    const profileResponse = await fetch("/api/profile/authenticate", {
        headers: { Authorization: accessToken },
    })
    expectStatus(profileResponse, 200, "referral account authentication stage")
    return { accessToken, user: await profileResponse.json() as User }
}

function claimReferral(account: ReferralTestAccount, referral: string) {
    return fetch("/api/profile/referral", {
        method: "POST",
        headers: {
            Authorization: account.accessToken,
            "Content-Type": "application/json",
            "X-Forwarded-For": uniqueTestIp(),
        },
        body: JSON.stringify({ referral }),
    })
}

async function getProfile(account: ReferralTestAccount): Promise<User> {
    const response = await fetch("/api/profile/authenticate", {
        headers: { Authorization: account.accessToken },
    })
    expectStatus(response, 200)
    return await response.json() as User
}

async function cleanupAccounts(accounts: ReferralTestAccount[]) {
    if (accounts.length === 0) return

    const userIds = accounts.map(account => account.user.id)
    const records = userIds.join(", ")
    await admin.query(`
        DELETE notification WHERE context IN [${records}];
        DELETE referralClaim WHERE claimant IN [${records}] OR recipient IN [${records}];
        DELETE session WHERE account IN (SELECT VALUE id FROM account WHERE user IN [${records}]);
        DELETE account WHERE user IN [${records}];
        DELETE userSettings WHERE user IN [${records}];
        DELETE user WHERE id IN [${records}];
    `)
}

it("keeps referral claims idempotent across retries and concurrent recipients", async () => {
    const accounts: ReferralTestAccount[] = []

    try {
        const claimant = await createAccount()
        accounts.push(claimant)
        const recipientA = await createAccount()
        accounts.push(recipientA)
        const recipientB = await createAccount()
        accounts.push(recipientB)
        const concurrentClaimant = await createAccount()
        accounts.push(concurrentClaimant)

        const recipientAId = extractId(recipientA.user.id)!
        const recipientBId = extractId(recipientB.user.id)!
        const claimantAId = extractId(claimant.user.id)!
        const claimantBId = extractId(concurrentClaimant.user.id)!
        const recipientABefore = await getProfile(recipientA)
        const recipientBBefore = await getProfile(recipientB)

        expectStatus(await claimReferral(claimant, claimantAId), 400, "self-referral stage")

        const firstClaim = await claimReferral(claimant, recipientAId)
        expectStatus(firstClaim, 200, "initial referral claim stage")
        expect(await firstClaim.text()).toBe("claimed")
        expect((await getProfile(recipientA)).tokens).toBe(recipientABefore.tokens + 1024)

        const replay = await claimReferral(claimant, recipientAId)
        expectStatus(replay, 200, "same-recipient retry stage")
        expect(await replay.text()).toBe("already-claimed")

        const alternateClaim = await claimReferral(claimant, recipientBId)
        expectStatus(alternateClaim, 200, "alternate-recipient retry stage")
        expect(await alternateClaim.text()).toBe("already-claimed")
        expect((await getProfile(recipientA)).tokens).toBe(recipientABefore.tokens + 1024)
        expect((await getProfile(recipientB)).tokens).toBe(recipientBBefore.tokens)

        const concurrentRecipientABefore = await getProfile(recipientA)
        const concurrentRecipientBBefore = await getProfile(recipientB)
        const concurrentResponses = await Promise.all([
            claimReferral(concurrentClaimant, recipientAId),
            claimReferral(concurrentClaimant, recipientBId),
        ])
        expect(concurrentResponses.map(response => response.status)).toEqual([200, 200])
        const concurrentResults = await Promise.all(concurrentResponses.map(response => response.text()))
        expect(concurrentResults.filter(result => result === "claimed")).toHaveLength(1)
        expect(concurrentResults.filter(result => result === "already-claimed")).toHaveLength(1)

        const concurrentRecipientAAfter = await getProfile(recipientA)
        const concurrentRecipientBAfter = await getProfile(recipientB)
        const concurrentRewardA = concurrentRecipientAAfter.tokens - concurrentRecipientABefore.tokens
        const concurrentRewardB = concurrentRecipientBAfter.tokens - concurrentRecipientBBefore.tokens
        expect([concurrentRewardA, concurrentRewardB].sort((a, b) => a - b)).toEqual([0, 1024])

        const claims = await admin.query<Array<Array<{ claimant: string, recipient: string }>>>(`
            SELECT claimant, recipient
            FROM referralClaim
            WHERE claimant IN [${claimant.user.id}, ${concurrentClaimant.user.id}];
        `)
        expect(claims.flat()).toHaveLength(2)
        expect(claims.flat().find(claim => claim.claimant === claimant.user.id)?.recipient).toBe(recipientA.user.id)
        expect([recipientA.user.id, recipientB.user.id]).toContain(
            claims.flat().find(claim => claim.claimant === concurrentClaimant.user.id)?.recipient,
        )

        const notifications = await admin.query<Array<Array<{ recipient: string, context: string }>>>(`
            SELECT recipient, context
            FROM notification
            WHERE context IN [${claimant.user.id}, ${concurrentClaimant.user.id}]
                AND recipient IN [${recipientA.user.id}, ${recipientB.user.id}];
        `)
        expect(notifications.flat()).toHaveLength(2)
    }
    finally {
        await cleanupAccounts(accounts)
    }
})