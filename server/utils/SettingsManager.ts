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

    static async canAttachImages(target: "posts" | "threads") {
        const settings = await this.get()
        return settings.media.images.enabled && settings.media.images.attachments[target]
    }

    static async canViewFeed(feed: keyof AppSettings["feeds"]) {
        const settings = await this.get()
        if (!settings.feeds[feed]) {
            throw createError({ statusCode: 404, statusMessage: "Feed is not available." })
        }
    }

    static async canPublish(target: "posts" | "threads", topics: string[]) {
        const settings = await this.get()
        const contentType = target === "posts" ? "Post" : "Thread"

        if (!settings[target].enabled) {
            throw createError({ statusCode: 403, statusMessage: `${contentType} publishing is disabled.` })
        }
        if (topics.length > settings.topics.perSubmission) {
            throw createError({ statusCode: 400, statusMessage: `You can only add ${settings.topics.perSubmission} topics per submission.` })
        }
        if (settings.topics.restrict && topics.some(topic => !settings.topics.allowed.includes(topic))) {
            throw createError({ statusCode: 403, statusMessage: "You must use one of the predefined topics." })
        }
    }

    static async update(id: string, settings: AppSettings) {
        this.validate(settings)

        return await new DatabaseQuery()
            .addSql(`
                UPDATE appSettings SET
                    about = $about,
                    email = $email,
                    moderation = $moderation,
                    content = $content,
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
            .addParameter("content", settings.content)
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
            .keys(settings, ["id", "about", "email", "moderation", "content", "voting", "topics", "feeds", "posts", "links", "threads", "media", "polls", "misc"])
            .confirm()

        validator
            .object(settings.about, "about", (v, about) => {
                v.keys(about, ["summary"])
                v.string(about.summary, "summary")
            })
            .object(settings.email, "email", (v, email) => {
                v.keys(email, ["support", "additional", "spool"])
                v.string(email.support, "support")
                v.string(email.additional, "additional")
                v.object(email.spool, "spool", (v, spool) => {
                    v.keys(spool, ["dailyLimit", "batchLimit", "maxRetries"])
                    v.integer(spool.dailyLimit, "dailyLimit", { min: 1, max: 100000 })
                    v.integer(spool.batchLimit, "batchLimit", { min: 1, max: 1000 })
                    v.integer(spool.maxRetries, "maxRetries", { min: 0, max: 10 })
                })
            })
            .object(settings.moderation, "moderation", (v, moderation) => {
                v.keys(moderation, ["perTopic", "threshold", "slowModes"])
                v.integer(moderation.perTopic, "perTopic", { min: 0 })
                v.integer(moderation.threshold, "threshold", { min: 1 })
                v.array(moderation.slowModes, "slowModes", (v, interval) => {
                    v.integer(interval, { min: 1 })
                })
            })
            .object(settings.voting, "voting", (v, voting) => {
                v.keys(voting, ["enabled", "misleading", "negative"])
                v.boolean(voting.enabled, "enabled")
                v.boolean(voting.misleading, "misleading")
                v.boolean(voting.negative, "negative")
            })
            .object(settings.topics, "topics", (v, topics) => {
                v.keys(topics, ["perSubmission", "restrict", "allowed"])
                v.integer(topics.perSubmission, "perSubmission", { min: 1, max: 5 })
                v.boolean(topics.restrict, "restrict")
                v.array(topics.allowed, "allowed", (v, topic) => {
                    v.string(topic)
                })
            })
            .object(settings.feeds, "feeds", (v, feeds) => {
                v.keys(feeds, ["search", "discover", "topics", "posts", "links", "threads", "images", "audio", "video", "polls"])
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
            .object(settings.posts, "posts", (v, posts) => {
                v.keys(posts, ["enabled"])
                v.boolean(posts.enabled, "enabled")
            })
            .object(settings.links, "links", (v, links) => {
                v.keys(links, ["enabled"])
                v.boolean(links.enabled, "enabled")
            })
            .object(settings.threads, "threads", (v, threads) => {
                v.keys(threads, ["enabled"])
                v.boolean(threads.enabled, "enabled")
            })
            .object(settings.media, "media", (v, media) => {
                v.keys(media, ["tokens", "images", "gallery", "audio", "video"])
                v.object(media.tokens, "tokens", (v, tokens) => {
                    v.keys(tokens, ["enabled"])
                    v.boolean(tokens.enabled, "enabled")
                })
                v.object(media.images, "images", (v, images) => {
                    v.keys(images, ["enabled", "uploadLimit", "attachments"])
                    v.boolean(images.enabled, "enabled")
                    v.integer(images.uploadLimit, "uploadLimit", { min: 0, max: 100 })
                    v.object(images.attachments, "attachments", (v, attachments) => {
                        v.keys(attachments, ["posts", "threads"])
                        v.boolean(attachments.posts, "posts")
                        v.boolean(attachments.threads, "threads")
                    })
                })
                v.object(media.gallery, "gallery", (v, gallery) => {
                    v.keys(gallery, ["enabled"])
                    v.boolean(gallery.enabled, "enabled")
                })
                v.object(media.audio, "audio", (v, audio) => {
                    v.keys(audio, ["enabled", "uploadLimit"])
                    v.boolean(audio.enabled, "enabled")
                    v.integer(audio.uploadLimit, "uploadLimit", { min: 0, max: 500 })
                })
                v.object(media.video, "video", (v, video) => {
                    v.keys(video, ["enabled", "uploadLimit"])
                    v.boolean(video.enabled, "enabled")
                    v.integer(video.uploadLimit, "uploadLimit", { min: 0 })
                })
            })
            .object(settings.polls, "polls", (v, polls) => {
                v.keys(polls, ["enabled"])
                v.boolean(polls.enabled, "enabled")
            })
            .object(settings.misc, "misc", (v, misc) => {
                v.keys(misc, ["feedback"])
                v.object(misc.feedback, "feedback", (v, feedback) => {
                    v.keys(feedback, ["enabled", "allowAnonymous"])
                    v.boolean(feedback.enabled, "enabled")
                    v.boolean(feedback.allowAnonymous, "allowAnonymous")
                })
            })
            .object(settings.content, "content", (v, content) => {
                v.keys(content, ["visibility"])
                v.object(content.visibility, "visibility", (v, visibility) => {
                    v.keys(visibility, ["nsfw", "spoiler"])
                    v.string(visibility.nsfw, "nsfw")
                    v.in(visibility.nsfw, "nsfw", ["show", "mask", "filter"])
                    v.string(visibility.spoiler, "spoiler")
                    v.in(visibility.spoiler, "spoiler", ["show", "mask", "filter"])
                })
            })
            .confirm()
    }
}