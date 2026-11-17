import type { FeedPage, Sortable } from "@@/shared/types"
import { getQuery, type H3Event } from "h3"

type FeedSort = "new" | "hot" | "top"

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50
const MAX_PAGE_OFFSET = 5_000_000

const FEED_FIELDS = [
    "id",
    "user.{id, name, roles}",
    "title",
    `string::slice(content ?? "", 0, 512) AS content`,
    "tags",
    "time",
    "edited",
    "timeEdited",
    "replyTo.{id, title, tags}",
    "topics",
    "comments",
    "votes",
    "(SELECT locked, slowed FROM ONLY moderation WHERE subject = $parent.id LIMIT 1) AS moderation",
    "score",
    "status",
    "images.{id, url}",
    "visits",
    "quote.{id, content, tags, time, replies, topics, votes, visits, status, user.{id, name, roles}}",
    "replies",
    "type",
    "tokens",
    "url",
    "preview",
    "description",
]

export function useFeedPaging(event: H3Event) {
    function getPageWindow(requestedSize: unknown, requestedOffset: unknown) {
        return {
            pageSize: Math.max(1, Math.min(MAX_PAGE_SIZE, Math.trunc(Number(requestedSize) || DEFAULT_PAGE_SIZE))),
            offset: Math.max(0, Math.min(MAX_PAGE_OFFSET, Math.trunc(Number(requestedOffset) || 0))),
        }
    }

    const query = getQuery(event)
    const sortBy: FeedSort = query.sortBy === "hot" || query.sortBy === "top" ? query.sortBy : "new"
    const orderBy = {
        new: "time DESC, sourceId ASC",
        hot: "hot DESC, time DESC, sourceId ASC",
        top: "score DESC, time DESC, sourceId ASC",
    }[sortBy]
    const { pageSize, offset } = getPageWindow(query.pageSize, query.offset)

    function selectPage<T>(candidates: T[]) {
        return {
            items: candidates.slice(0, pageSize),
            more: candidates.length > pageSize,
        }
    }

    function createPage<T>(candidates: T[]): Promise<FeedPage<T>>
    function createPage<C, T>(candidates: C[], hydrate: (candidates: C[]) => Promise<T[]>): Promise<FeedPage<T>>
    async function createPage<C, T>(candidates: C[], hydrate?: (candidates: C[]) => Promise<T[]>): Promise<FeedPage<C> | FeedPage<T>> {
        const selected = selectPage(candidates)
        if (hydrate) {
            return {
                items: await hydrate(selected.items),
                pageSize,
                offset,
                more: selected.more,
            }
        }

        return {
            items: selected.items,
            pageSize,
            offset,
            more: selected.more,
        }
    }

    async function hydrate<T extends Sortable>(sourceIds: string[]): Promise<T[]> {
        if (sourceIds.length === 0) return []

        return await new DatabaseQuery()
            .addSql(`
                SELECT ${FEED_FIELDS.join(", ")}
                FROM $ids
            `)
            .addRecords("ids", sourceIds)
            .queryAll<T>()
    }

    return {
        sortBy,
        orderBy,
        pageSize,
        offset,
        limit: pageSize + 1,
        createPage,
        hydrate,
    }
}
