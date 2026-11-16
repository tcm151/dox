import { ContentManager } from "@@/server/utils/ContentManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    return await ContentManager.award(`thread:${id}`, auth)
})