import type { AppSettings } from "@@/shared/types"

export class SettingsManager {
    static async get(id: string = "default") {
        return await new DatabaseQuery()
            .addSql(`
                SELECT *
                FROM $settings
            `)
            .addRecord("settings", `appSettings:${id}`)
            .queryOne<AppSettings>()
    }
    static async update(id: string, settings: AppSettings) {
        return await new DatabaseQuery()
            .addSql(`
                UPDATE appSettings SET
                    email = $email,
                    moderation = $moderation,
                    voting = $voting,
                    topics = $topics,
                    feeds = $feeds,
                    posts = $posts,
                    links = $links,
                    threads = $threads,
                    media = $media,
                    polls = $polls,
                    misc = $misc
                WHERE id = $id
            `)
            .addRecord("id", id)
            .addParameter("email", settings.email)
            .addParameter("moderation", settings.moderation)
            .addParameter("voting", settings.voting)
            .addParameter("topics", settings.topics)
            .addParameter("feeds", settings.feeds)
            .addParameter("posts", settings.posts)
            .addParameter("links", settings.links)
            .addParameter("threads", settings.threads)
            .addParameter("media", settings.media)
            .addParameter("polls", settings.polls)
            .addParameter("misc", settings.misc)
            .queryOne<AppSettings>()
    }
}