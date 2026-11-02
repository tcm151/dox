import type { AppSettings } from "@@/shared/types"
import { Validator } from "@@/shared/utils/Validator"

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
        this.validate(settings)

        return await new DatabaseQuery()
            .addSql(`
                UPDATE appSettings SET
                    about = $about,
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
            .addParameter("about", settings.about)
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

    private static validate(settings: AppSettings) {
        const validator = new Validator("AppSettings")
        validator.object(settings, "settings")
        validator.confirm()

        validator.object(settings.about, "about", (v, about) => {
            v.string(about.summary, "summary")
        })
        validator.object(settings.email, "email", (v, email) => {
            v.string(email.support, "support")
            v.string(email.additional, "additional")
        })
        validator.object(settings.moderation, "moderation", (v, moderation) => {
            v.integer(moderation.perTopic, "perTopic", { min: 0 })
            v.integer(moderation.threshold, "threshold", { min: 1 })
            v.array(moderation.slowModes, "slowModes", (v, interval) => {
                v.integer(interval, { min: 1 })
            })
        })
        validator.object(settings.voting, "voting", (v, voting) => {
            v.boolean(voting.enabled, "enabled")
            v.boolean(voting.misleading, "misleading")
            v.boolean(voting.negative, "negative")
        })
        validator.object(settings.topics, "topics", (v, topics) => {
            v.integer(topics.perSubmission, "perSubmission", { min: 0, max: 5 })
            v.boolean(topics.restrict, "restrict")
            v.array(topics.allowed, "allowed", (v, topic) => {
                v.string(topic)
            })
        })
        validator.object(settings.feeds, "feeds", (v, feeds) => {
            v.boolean(feeds.search, "search")
            v.boolean(feeds.discover, "discover")
            v.boolean(feeds.topics, "topics")
            v.boolean(feeds.posts, "posts")
            v.boolean(feeds.links, "links")
            v.boolean(feeds.threads, "threads")
            v.boolean(feeds.images, "images")
            v.boolean(feeds.audio, "audio")
            v.boolean(feeds.video, "video")
            v.boolean(feeds.polls, "polls")
        })
        validator.object(settings.posts, "posts", (v, posts) => {
            v.boolean(posts.enabled, "enabled")
        })
        validator.object(settings.links, "links", (v, links) => {
            v.boolean(links.enabled, "enabled")
        })
        validator.object(settings.threads, "threads", (v, threads) => {
            v.boolean(threads.enabled, "enabled")
        })
        validator.object(settings.media, "media", (v, media) => {
            v.object(media.tokens, "tokens", (v, tokens) => {
                v.boolean(tokens.enabled, "enabled")
            })
            v.object(media.images, "images", (v, images) => {
                v.boolean(images.enabled, "enabled")
                v.integer(images.uploadLimit, "uploadLimit", { min: 0, max: 100 })
            })
            v.object(media.audio, "audio", (v, audio) => {
                v.boolean(audio.enabled, "enabled")
                v.integer(audio.uploadLimit, "uploadLimit", { min: 0, max: 500 })
            })
            v.object(media.video, "video", (v, video) => {
                v.boolean(video.enabled, "enabled")
                v.integer(video.uploadLimit, "uploadLimit", { min: 0 })
            })
        })
        validator.object(settings.polls, "polls", (v, polls) => {
            v.boolean(polls.enabled, "enabled")
        })
        validator.object(settings.misc, "misc", (v, misc) => {
            v.object(misc.feedback, "feedback", (v, feedback) => {
                v.boolean(feedback.enabled, "enabled")
                v.boolean(feedback.allowAnonymous, "allowAnonymous")
            })
        })

        validator.confirm()
    }
}