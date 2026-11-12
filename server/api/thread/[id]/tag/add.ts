import { ModerationManager } from "@@/server/utils/ModerationManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "moderator"])

    const id = event.context.params?.id
    const body = await readBody<{ tag: string }>(event)

    return await ModerationManager.addContentTag(`thread:${id}`, auth.id, body.tag)
})
