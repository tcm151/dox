import type { SearchResult } from "@@/shared/types"
import { Validator } from "@@/shared/utils/Validator"
import { authenticateOptionalRequest } from "@@/server/utils/auth"
import { useFeedPaging } from "@@/server/utils/feedPagination"
import { SettingsManager } from "@@/server/utils/SettingsManager"
import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

const MINIMUM_SEARCH_SCORE = 0.5
const SEARCH_TYPES = ["post", "thread", "gallery", "comment"] as const

interface SearchCandidate {
    id: string
    exact: boolean
    score: number
}

function isValidSearchDate(value: unknown): value is string {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

    const timestamp = Date.parse(`${value}T00:00:00.000Z`)
    return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
}

function nextUtcDay(date: string) {
    const nextDay = new Date(`${date}T00:00:00.000Z`)
    nextDay.setUTCDate(nextDay.getUTCDate() + 1)
    return nextDay.toISOString()
}

export default defineEventHandler(async (event) => {
    await SettingsManager.canViewFeed("search")

    const query = getQuery(event)
    const { text } = query
    const type = typeof query.type === "string" ? query.type : undefined
    const topic = typeof query.topic === "string" ? query.topic : undefined
    const user = typeof query.user === "string" ? query.user.trim() : undefined
    const from = typeof query.from === "string" ? query.from : undefined
    const to = typeof query.to === "string" ? query.to : undefined
    const paging = useFeedPaging(event)

    const validator = new Validator("FeedSearch")
    validator.optional(query.type, (v, value) => {
        v.string(value, "type")
        v.in(value, "type", SEARCH_TYPES)
    })
    validator.optional(query.topic, (v, value) => {
        v.string(value, "topic")
        v.match(value, "topic.id", "topic")
    })
    validator.optional(query.user, (v, value) => v.string(value, "user", { maxLength: 32 }))
    validator.optional(query.from, (v, value) => {
        v.string(value, "from", { minLength: 10, maxLength: 10 })
        v.test(value, isValidSearchDate, "must be a valid YYYY-MM-DD date", "from")
    })
    validator.optional(query.to, (v, value) => {
        v.string(value, "to", { minLength: 10, maxLength: 10 })
        v.test(value, isValidSearchDate, "must be a valid YYYY-MM-DD date", "to")
    })
    if (from && to && isValidSearchDate(from) && isValidSearchDate(to)) {
        validator.test(from, () => from <= to, "must be on or before 'to'", "from")
    }
    validator.confirm()

    if (typeof text !== "string" || text.trim() === "") {
        return paging.createPage([])
    }

    const viewer = await authenticateOptionalRequest(event)
    const excluded = await UserSettingsManager.getFilteredTargets(viewer)
    const candidates = await new DatabaseQuery()
        .addSql(`
            LET $comments = (
                SELECT id, time,
                    string::contains(string::lowercase(content), string::lowercase($text)) AS exact,
                    search::score(1) AS score
                FROM comment
                WHERE content @1@ $text
                AND deleted != true
                AND status = "active"
                AND context.status = "active"
                AND context.deleted != true
                AND ($topic IS NULL OR context.topics CONTAINS $topic)
                AND ($user IS NULL OR string::contains(string::lowercase(user.name), string::lowercase($user)))
                AND ($from IS NULL OR time >= type::datetime($from))
                AND ($to IS NULL OR time < type::datetime($to))
                AND ($excluded.len() = 0 OR $excluded CONTAINSNONE array::union([user, context.user], context.topics ?? []))
            );

            LET $posts = (
                SELECT id, time,
                    (string::contains(string::lowercase(title), string::lowercase($text))
                        OR string::contains(string::lowercase(content), string::lowercase($text))) AS exact,
                    (search::score(1) * 2 + search::score(2)) AS score
                FROM post
                WHERE (title @1@ $text OR content @2@ $text)
                AND status = "active"
                AND deleted != true
                AND ($topic IS NULL OR topics CONTAINS $topic)
                AND ($user IS NULL OR string::contains(string::lowercase(user.name), string::lowercase($user)))
                AND ($from IS NULL OR time >= type::datetime($from))
                AND ($to IS NULL OR time < type::datetime($to))
                AND ($excluded.len() = 0 OR $excluded CONTAINSNONE array::union([user], topics ?? []))
            );

            LET $threads = (
                SELECT id, time,
                    string::contains(string::lowercase(content), string::lowercase($text)) AS exact,
                    search::score(1) AS score
                FROM thread
                WHERE content @1@ $text
                AND status = "active"
                AND deleted != true
                AND ($topic IS NULL OR topics CONTAINS $topic)
                AND ($user IS NULL OR string::contains(string::lowercase(user.name), string::lowercase($user)))
                AND ($from IS NULL OR time >= type::datetime($from))
                AND ($to IS NULL OR time < type::datetime($to))
                AND ($excluded.len() = 0 OR $excluded CONTAINSNONE array::union([user], topics ?? []))
            );

            LET $galleries = (
                SELECT id, time,
                    (string::contains(string::lowercase(title), string::lowercase($text))
                        OR string::contains(string::lowercase(description), string::lowercase($text))) AS exact,
                    (search::score(1) * 2 + search::score(2)) AS score
                FROM gallery
                WHERE (title @1@ $text OR description @2@ $text)
                AND status = "active"
                AND ($topic IS NULL OR topics CONTAINS $topic)
                AND ($user IS NULL OR string::contains(string::lowercase(user.name), string::lowercase($user)))
                AND ($from IS NULL OR time >= type::datetime($from))
                AND ($to IS NULL OR time < type::datetime($to))
                AND ($excluded.len() = 0 OR $excluded CONTAINSNONE array::union([user], topics ?? []))
            );

            RETURN SELECT id, time, exact, score FROM $posts, $threads, $galleries, $comments
                WHERE ($type IS NULL OR record::tb(id) = $type)
                AND (exact = true OR score >= $minimumScore)
                ORDER BY exact DESC, score DESC, time DESC, id ASC
                LIMIT $limit
                START $offset;
        `)
        .addTransaction()
        .addParameter("text", text.trim())
        .addParameter("type", type ?? null)
        .addParameter("user", user || null)
        .addParameter("from", from ? `${from}T00:00:00.000Z` : null)
        .addParameter("to", to ? nextUtcDay(to) : null)
        .addParameter("minimumScore", MINIMUM_SEARCH_SCORE)
        .addRecord("topic", topic ? `topic:${topic}` : null)
        .addRecords("excluded", excluded)
        .addParameter("limit", paging.limit)
        .addParameter("offset", paging.offset)
        .queryAll<SearchCandidate>()

    return await paging.createPage(candidates, async (selected) => {
        if (selected.length === 0) return []

        const selectedIds = selected.map(candidate => candidate.id)
        const getIds = (table: typeof SEARCH_TYPES[number]) =>
            selectedIds.filter(id => id.startsWith(`${table}:`))

        const postIds = getIds("post")
        const threadIds = getIds("thread")
        const galleryIds = getIds("gallery")
        const commentIds = getIds("comment")
        const [posts, threads, galleries, comments] = await Promise.all([
            postIds.length === 0 ? Promise.resolve<SearchResult[]>([]) : new DatabaseQuery()
                .addSql(`
                    SELECT id, user.{id, name, roles}, title, string::slice(content, 0, 512) AS content, tags, time, edited, timeEdited, score,
                        replyTo.{id, title, tags}, topics, comments, votes, status, images.{id, url}, visits, moderation
                    FROM post
                    WHERE id IN $ids
                `)
                .addRecords("ids", postIds)
                .queryAll<SearchResult>(),
            threadIds.length === 0 ? Promise.resolve<SearchResult[]>([]) : new DatabaseQuery()
                .addSql(`
                    SELECT id, user.{id, name, roles}, content, tags, time, topics, replies, votes, score,
                        edited, timeEdited, visits, images.{id, url},
                        (SELECT locked, slowed FROM ONLY moderation WHERE subject = $parent.id LIMIT 1) AS moderation
                    FROM thread
                    WHERE id IN $ids
                `)
                .addRecords("ids", threadIds)
                .queryAll<SearchResult>(),
            galleryIds.length === 0 ? Promise.resolve<SearchResult[]>([]) : new DatabaseQuery()
                .addSql(`
                    SELECT id, user.{id, name, roles}, title, description, tags, time,
                        topics, images.{id, url}, votes, score, visits, status, moderation
                    FROM gallery
                    WHERE id IN $ids
                `)
                .addRecords("ids", galleryIds)
                .queryAll<SearchResult>(),
            commentIds.length === 0 ? Promise.resolve<SearchResult[]>([]) : new DatabaseQuery()
                .addSql(`
                    SELECT id, user.{id, name, roles}, context.{id, title, description, url, tags}, moderation,
                        content, time, edited, deleted, status, timeEdited, votes, score
                    FROM comment
                    WHERE id IN $ids
                `)
                .addRecords("ids", commentIds)
                .queryAll<SearchResult>(),
        ])

        const hydrated = new Map<string, SearchResult>()
        for (const item of [...posts, ...threads, ...galleries, ...comments]) {
            hydrated.set(item.id, item)
        }

        return selected.flatMap((candidate) => {
            const item = hydrated.get(candidate.id)
            return item ? [{
                ...item,
                search: { exact: candidate.exact, score: candidate.score },
            }] : []
        })
    })
})