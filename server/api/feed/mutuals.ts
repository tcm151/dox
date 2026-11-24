import type { Sortable } from "@@/shared/types"
import { authenticateRequest } from "@@/server/utils/auth"
import { SettingsManager } from "@@/server/utils/SettingsManager"
import { useFeedPaging } from "@@/server/utils/feedPagination"
import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

export default defineEventHandler(async (event) => {
    await SettingsManager.canViewFeed("discover")

    const paging = useFeedPaging(event)
    const viewer = await authenticateRequest(event)
    const excluded = await UserSettingsManager.getFilteredTargets(viewer)

    const candidates = await new DatabaseQuery()
        .addSql(`
            SELECT sourceId, time, score, fn::sort_hot(score, time, time::now()) AS hot
            FROM feed
            WHERE (user.following CONTAINS $viewer AND $viewer.following CONTAINS user)
            AND ($excluded.len() = 0 OR $excluded CONTAINSNONE array::union([user], topics ?? []))
            ORDER BY ${paging.orderBy}
            LIMIT $limit
            START $offset
        `)
        .addRecord("viewer", viewer.id)
        .addRecords("excluded", excluded)
        .addParameter("limit", paging.limit)
        .addParameter("offset", paging.offset)
        .queryAll<{ sourceId: string }>()

    return await paging.createPage(candidates, s => paging.hydrate<Sortable>(s.map(c => c.sourceId)))
})