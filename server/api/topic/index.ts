import { TopicManager } from "@@/server/utils/TopicManager"

export default defineEventHandler(async (event) => {
    return await TopicManager.list()
})