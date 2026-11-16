import { ContentManager } from "@@/server/utils/ContentManager"

export default defineEventHandler(async (event) => {
    const user = await authenticateRequest(event)
    const { id } = event.context.params!

    return await ContentManager.unsave(id!, user.id)
})