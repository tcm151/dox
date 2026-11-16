import type { FeedPage, Sortable } from "@@/shared/types"
import { authenticateOptionalRequest, authenticateRequest } from "@@/server/utils/auth"
import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"
import { getQuery, type H3Event } from "h3"

export type FeedSort = "new" | "hot" | "top"

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50
const MAX_OFFSET = 5_000_000

const FEED_ORDER_BY: Record<FeedSort, string> = {
    new: "time DESC, sourceId ASC",
    hot: "hot DESC, time DESC, sourceId ASC",
    top: "score DESC, time DESC, sourceId ASC",
}

// TODO I think hot sorting isn't quite working right
const FEED_FIELDS = [
    "id",
    "user.id",
    "user.name",
    "title",
    `string::slice(content ?? "", 0, 512) AS content`,
    "tags",
    "time",
    "edited",
    "timeEdited",
    "replyTo.id",
    "replyTo.title",
    "replyTo.tags",
    "topics",
    "comments",
    "votes",
    "(SELECT locked, slowed FROM ONLY moderation WHERE subject = $parent.id LIMIT 1) AS moderation",
    "score",
    "status",
    "images.{id, url} AS images",
    "visits",
    "quote.{id, content, tags, time, replies, topics, votes, visits, user.{id, name}} AS quote",
    "replies",
    "type",
    "tokens",
    "url",
    "preview",
    "description",
]

interface FeedCandidate {
    sourceId: string
}

export async function queryFeedPage<T extends Sortable>(event: H3Event, following = false): Promise<FeedPage<T>> {
    const queryParams = getQuery(event)
    const sortBy = queryParams.sortBy === "hot" || queryParams.sortBy === "top" ? queryParams.sortBy : "new"
    const pageSize = Math.max(1, Math.min(MAX_PAGE_SIZE, Math.trunc(Number(queryParams.pageSize) || DEFAULT_PAGE_SIZE)))
    const offset = Math.max(0, Math.min(MAX_OFFSET, Math.trunc(Number(queryParams.offset) || 0)))

    const user = following
        ? await authenticateRequest(event)
        : await authenticateOptionalRequest(event)
    const excluded = await UserSettingsManager.getFilteredTargets(user)
    const query = new DatabaseQuery()
        .addSql(`
            SELECT sourceId, time, score, hot
            FROM feed
            WHERE ($follow = false OR (topics CONTAINSANY $user.topics OR $user.following CONTAINS user))
            AND ($excluded.len() = 0 OR $excluded CONTAINSNONE array::union([user], topics ?? []))
            ORDER BY ${FEED_ORDER_BY[sortBy]}
            LIMIT $limit
            START $offset
        `)
        .addRecords("excluded", excluded)
        .addParameter("limit", pageSize + 1)
        .addParameter("offset", offset)
        .addParameter("follow", following)

    if (user) {
        query.addRecord("user", user.id)
    }

    const candidates = await query.queryAll<FeedCandidate>()
    const more = candidates.length > pageSize
    const pageCandidates = candidates.slice(0, pageSize)
    if (pageCandidates.length === 0) {
        return { items: [], offset, more: false }
    }

    const items = await new DatabaseQuery()
        .addSql(`
            SELECT ${FEED_FIELDS.join(", ")}
            FROM $ids
            FETCH quote.user
        `)
        .addRecords("ids", pageCandidates.map(candidate => candidate.sourceId))
        .queryAll<T>()

    return {
        items,
        offset,
        more,
    }
}
