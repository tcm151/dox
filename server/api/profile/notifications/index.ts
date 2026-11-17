import type { Notification, NotificationPage } from "@@/shared/types"
import { Validator } from "@@/shared/utils/Validator"
import { useFeedPaging } from "@@/server/utils/feedPagination"

interface NotificationQuery {
    dismissed: string
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const query = getQuery<NotificationQuery>(event)
    const paging = useFeedPaging(event)

    new Validator("NotificationQuery")
        .string(query.dismissed, "dismissed")
        .in(query.dismissed, "dismissed", ["true", "false"])
        .confirm()

    const dismissed = query.dismissed === "true"
    const { total } = await new DatabaseQuery()
        .addSql(`
            SELECT COUNT() AS total
            FROM notification
            WHERE recipient = $user
            AND ($dismissed = true OR viewed = false)
            GROUP ALL
        `)
        .addRecord("user", auth.id)
        .addParameter("dismissed", dismissed)
        .queryOne<{ total: number }>()

    const candidates = await new DatabaseQuery()
        .addSql(`
            SELECT id, recipient, context, message, time, viewed
            FROM notification
            WHERE recipient = $user
            AND ($dismissed = true OR viewed = false)
            ORDER BY time DESC, id ASC
            LIMIT $limit
            START $offset
        `)
        .addRecord("user", auth.id)
        .addParameter("dismissed", dismissed)
        .addParameter("limit", paging.limit)
        .addParameter("offset", paging.offset)
        .queryAll<Notification>()

    const page = await paging.createPage(candidates)
    return {
        total,
        ...page,
    } satisfies NotificationPage
})