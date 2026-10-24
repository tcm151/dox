import type { FeedPage, Sortable } from "@@/shared/types"
import { authenticateRequest } from "@@/server/utils/auth"
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

const FEED_FIELDS = [
    "id",
    "user.id",
    "user.name",
    "title",
    "content",
    "time",
    "edited",
    "timeEdited",
    "replyTo.id",
    "replyTo.title",
    "topics",
    "comments",
    "votes",
    "score",
    "archived",
    "images.{id, url} AS images",
    "visits",
    "quote.{id, content, time, replies, topics, votes, visits, user.{id, name}} AS quote",
    "replies",
    "type",
    "tokens",
    "url",
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

    const query = new DatabaseQuery()
        .addSql(`
            SELECT sourceId, time, score, hot
            FROM feed
            WHERE $follow = false OR (
                topics CONTAINSANY $user.topics OR $user.following CONTAINS user
            )
            ORDER BY ${FEED_ORDER_BY[sortBy]}
            LIMIT $limit
            START $offset
        `)
        .addParameter("limit", pageSize + 1)
        .addParameter("offset", offset)
        .addParameter("follow", following)

    if (following) {
        const user = await authenticateRequest(event)
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
