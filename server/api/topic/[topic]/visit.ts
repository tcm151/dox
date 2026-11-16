import { ContentManager } from "@@/server/utils/ContentManager"

export default defineEventHandler(async (event) => {
    const id = event.context.params!.topic!.toString()

    return await ContentManager.visit(`topic:${id}`)
})