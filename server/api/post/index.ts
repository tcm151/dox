import type { Post } from "@@/shared/types"
import { SettingsManager } from "@@/server/utils/SettingsManager"
import { authenticateOptionalRequest } from "@@/server/utils/auth"
import { useFeedPaging } from "@@/server/utils/feedPagination"
import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

export default defineEventHandler(async (event) => {
    await SettingsManager.canViewFeed("posts")

    const paging = useFeedPaging(event)
    const viewer = await authenticateOptionalRequest(event)
    const excluded = await UserSettingsManager.getFilteredTargets(viewer)

    const candidates = await new DatabaseQuery()
        .addSql(`
            SELECT sourceId, fn::sort_hot(score, time, time::now()) AS hot
            FROM feed
            WHERE record::tb(sourceId) = "post"
            AND ($excluded.len() = 0 OR $excluded CONTAINSNONE array::union([user], topics ?? []))
            ORDER BY ${paging.orderBy}
            LIMIT $limit
            START $offset
        `)
        .addRecords("excluded", excluded)
        .addParameter("limit", paging.limit)
        .addParameter("offset", paging.offset)
        .queryAll<{ sourceId: string }>()

    return await paging.createPage(candidates, selected =>
        paging.hydrate<Post>(selected.map(candidate => candidate.sourceId)),
    )
})