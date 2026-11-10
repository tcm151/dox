import { AccountManager } from "@@/server/utils/repos/AccountManager"

export default defineEventHandler(async (event) => {
    const user = await authenticateRequest(event)
    const body = await readBody<{ password: string, confirmation: string }>(event)

    return await AccountManager.deleteAccount(user.id, body.password, body.confirmation)
})
