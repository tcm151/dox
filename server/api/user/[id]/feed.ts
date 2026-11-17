import type { Sortable } from "@@/shared/types"
import { authenticateOptionalRequest } from "@@/server/utils/auth"
import { useFeedPaging } from "@@/server/utils/feedPagination"
import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!
    const paging = useFeedPaging(event)

    const viewer = await authenticateOptionalRequest(event)
    if (!await UserSettingsManager.canViewProfile(`user:${id}`, viewer)) {
        return paging.createPage([])
    }

    const excluded = await UserSettingsManager.getFilteredTargets(viewer)

    const candidates = await new DatabaseQuery()
        .addSql(`
            SELECT sourceId, fn::sort_hot(score, time, time::now()) AS hot
            FROM feed
            WHERE user = $user
            AND ($excluded.len() = 0 OR $excluded CONTAINSNONE array::union([user], topics ?? []))
            ORDER BY ${paging.orderBy}
            LIMIT $limit
            START $offset
        `)
        .addRecord("user", `user:${id}`)
        .addRecords("excluded", excluded)
        .addParameter("limit", paging.limit)
        .addParameter("offset", paging.offset)
        .queryAll<{ sourceId: string }>()

    return await paging.createPage(candidates, selected =>
        paging.hydrate<Sortable>(selected.map(candidate => candidate.sourceId)),
    )
})