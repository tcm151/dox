import { ContentManager } from "@@/server/utils/ContentManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    const { id } = event.context.params!

    await ContentManager.archive(`link:${id}`)

    return true
})