import { ContentManager } from "@@/server/utils/ContentManager"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    return await ContentManager.visit(`gallery:${id}`)
})