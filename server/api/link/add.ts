import type { Link } from "@@/shared/types"
import { Validator } from "@@/shared/utils/Validator"
import { ModerationManager } from "@@/server/utils/ModerationManager"
import { SettingsManager } from "@@/server/utils/SettingsManager"
import { linkPreviewManager } from "@@/server/utils/LinkPreviewManager"

type CreateLinkRequest = {
    title: string
    description?: string
    url: string
    tags?: string[]
    topics: string[]
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const link = await readBody<CreateLinkRequest>(event)
    
    new Validator("Link")
        .string(link.title, "title", { minLength: 4, maxLength: 128 })
        .optional(link.description, (v, description) => v.string(description, "description", { maxLength: 256 }))
        .url(link.url, "url", { maxLength: 2048 })
        .array(link.topics, "topics", (v, t) => {
            v.string(t)
            v.regex(t, /^topic:[\w-]+$/)
        })
        .notEmpty(link.topics, "topics")
        .optional(link.tags, (v, tags) => {
            v.array(tags, "tags", (v, t) => {
                v.string(t)
                v.in(t, ["nsfw", "spoiler"])
            })
        })
        .confirm()

    const settings = await SettingsManager.get()
    if (!settings.links.enabled) {
        throw createError({ statusCode: 403, statusMessage: "Link publishing is disabled." })
    }

    await ModerationManager.checkTopicCooldown(auth.id, link.topics)
    const preview = await linkPreviewManager.get(link.url).catch(() => ({}))

    return await new DatabaseQuery()
        .addSql(`
            LET $unavailableTopics = (
                SELECT VALUE id
                FROM topic
                WHERE id IN $topics AND status != "active"
            );
            IF $unavailableTopics.len() > 0 {
                fn::http(409, "Locked topics cannot be assigned to new content.");
            };

            RETURN CREATE link SET
                user = $user,
                title = $title,
                description = $description,
                url = $url,
                preview = $preview,
                tags = $tags,
                topics = $topics,
                votes.positive = [$user];
        `)
        .addTransaction()
        .addRecord("user", auth.id)
        .addParameter("title", link.title)
        .addParameter("description", link.description ?? "")
        .addParameter("url", link.url)
        .addParameter("preview", preview)
        .addParameter("tags", link.tags ?? [])
        .addRecords("topics", link.topics)
        .queryOne<Link>()
})