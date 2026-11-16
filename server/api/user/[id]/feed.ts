import type { Sortable } from "@@/shared/types"
import { authenticateOptionalRequest } from "@@/server/utils/auth"
import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!
    let query = getQuery<{ sortBy: string }>(event)

    const viewer = await authenticateOptionalRequest(event)
    const excluded = await UserSettingsManager.getFilteredTargets(viewer)

    const items = await new DatabaseQuery()
        .addSql(`
            LET $posts = (
                SELECT id, user.{id, name, roles}, title, string::slice(content, 0, 512) AS content, tags, time, edited, timeEdited,
                    replyTo.{id, title, tags}, topics, comments, votes, score,
                    status, images.{id, url}, visits, moderation
                FROM post
                WHERE user = $user
                AND status = "active"
                AND ($excluded.len() = 0 OR $excluded CONTAINSNONE array::union([user], topics ?? []))
                ORDER BY time DESC
            );

            LET $links = (
                SELECT id, user.{id, name, roles}, title, description, url, preview, tags, time, edited, timeEdited,
                    topics, comments, votes, score, status, visits, moderation
                FROM link
                WHERE user = $user
                AND status = "active"
                AND ($excluded.len() = 0 OR $excluded CONTAINSNONE array::union([user], topics ?? []))
                ORDER BY time DESC
            );

            LET $threads = (
                SELECT id, user.{id, name, roles}, content, tags, time,
                    topics, quote.{id, content, tags, time, replies, topics, votes, visits, status, user.{id, name, roles}}, replies, votes, score,
                    edited, timeEdited, visits, images.{id, url},
                    (SELECT locked, slowed FROM ONLY moderation WHERE subject = $parent.id LIMIT 1) AS moderation
                FROM thread
                WHERE user = $user
                AND replyTo = NONE
                AND status = "active"
                AND ($excluded.len() = 0 OR $excluded CONTAINSNONE array::union([user], topics ?? []))
                ORDER BY time DESC
            );

            LET $galleries = (
                SELECT id, user.{id, name, roles}, title, description, tags, time,
                    topics, images.{id, url}, votes, score, visits, status, moderation
                FROM gallery
                WHERE user = $user
                AND status = "active"
                AND ($excluded.len() = 0 OR $excluded CONTAINSNONE array::union([user], topics ?? []))
                ORDER BY time DESC
            );

            RETURN SELECT * FROM $posts, $links, $threads, $galleries;
        `)
        .addTransaction()
        .addRecord("user", `user:${id}`)
        .addRecords("excluded", excluded)
        .queryAll<Sortable>()

    return sortList(items, query.sortBy)
})