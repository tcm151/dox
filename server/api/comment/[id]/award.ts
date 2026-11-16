import { ContentManager } from "@@/server/utils/ContentManager"

export default defineEventHandler(async (event) => {
    const awarder = await authenticateRequest(event)
    const { id } = event.context.params!

    return await ContentManager.award(`comment:${id}`, awarder)
})