import { queryFeedPage } from "@@/server/utils/feedPagination"

export default defineEventHandler(async (event) => {
    return await queryFeedPage(event)
})