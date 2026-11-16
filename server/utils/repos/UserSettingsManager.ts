import type {
    ContentFilterTargetType,
    ContentFilterTargetView,
    User,
    UserContentFilterView,
    UserSettings,
} from "@@/shared/types"
import { extractId } from "@@/shared/utils/records"
import { Validator } from "@@/shared/utils/Validator"

export class UserSettingsManager {
    static async get(user: string): Promise<UserSettings> {
        return await new DatabaseQuery()
            .addSql(`
                SELECT *
                FROM userSettings
                WHERE user = $user
            `)
            .addRecord("user", user)
            .queryOne<UserSettings>()
    }

    static async update(user: string, settings: UserSettings): Promise<UserSettings> {
        new Validator("UserSettings")
            .object(settings.notifications, "Notification preferences", v => {
                v.boolean(settings.notifications.inApp, "In-app notifications")
                v.boolean(settings.notifications.email, "Email notifications")
            })
            .object(settings.ui, "UI preferences", v => {
                v.boolean(settings.ui.hoverAnimations, "Hover animations")
                v.number(settings.ui.hintDuration, "Hint duration")
            })
            .object(settings.content, "Content settings", (v, content) => {
                v.object(content.visibility, "visibility", (v, visibility) => {
                    for (const [tag, mode] of Object.entries(visibility)) {
                        v.string(mode, tag)
                        v.in(tag, tag, ["nsfw", "spoiler"])
                        v.in(mode, tag, ["show", "mask", "filter"])
                    }
                })
            })
            .confirm()

        return await new DatabaseQuery()
            .addSql(`
                UPDATE userSettings SET
                    notifications = $notifications,
                    content.visibility = $visibility,
                    ui = $ui
                WHERE user = $user
            `)
            .addRecord("user", user)
            .addParameter("notifications", settings.notifications)
            .addParameter("ui", settings.ui)
            .addParameter("visibility", settings.content.visibility)
            .queryOne<UserSettings>()
    }

    static async list(user: string): Promise<UserContentFilterView> {
        const filters = await new DatabaseQuery()
            .addSql(`
                SELECT
                    content.filters.muted.{id, name} AS muted,
                    content.filters.blocked.{id, name} AS blocked
                FROM userSettings
                WHERE user = $user
            `)
            .addRecord("user", user)
            .queryOne<{
                muted: Array<{ id: string, name?: string }>
                blocked: Array<{ id: string, name?: string }>
            }>()
        const muted = filters.muted.map(target => this.toTargetView(target))
        const blocked = filters.blocked.map(target => this.toTargetView(target))
        const byName = (left: ContentFilterTargetView, right: ContentFilterTargetView) => left.name.localeCompare(right.name)

        return {
            muted: muted.sort(byName),
            blocked: blocked.sort(byName),
        }
    }

    static async mute(user: string, target: string): Promise<boolean> {
        this.validateTarget(target)
        return await new DatabaseQuery()
            .addSql(`
                IF !record::exists($target) {
                    fn::http(404, "The user or topic does not exist.");
                };
                IF $target = $user {
                    fn::http(400, "You cannot mute yourself.");
                };

                UPDATE userSettings SET
                    content.filters.muted = array::union(content.filters.muted, [$target])
                WHERE user = $user;

                RETURN true;
            `)
            .addTransaction()
            .addRecord("user", user)
            .addRecord("target", target)
            .queryValue<boolean>()
    }

    static async unmute(user: string, target: string): Promise<boolean> {
        this.validateTarget(target)
        return await new DatabaseQuery()
            .addSql(`
                UPDATE userSettings SET
                    content.filters.muted = array::difference(content.filters.muted, [$target])
                WHERE user = $user;

                RETURN true;
            `)
            .addTransaction()
            .addRecord("user", user)
            .addRecord("target", target)
            .queryValue<boolean>()
    }

    static async block(user: string, target: string): Promise<boolean> {
        this.validateTarget(target)
        return await new DatabaseQuery()
            .addSql(`
                IF !record::exists($target) {
                    fn::http(404, "The user or topic does not exist.");
                };
                IF $target = $user {
                    fn::http(400, "You cannot block yourself.");
                };
                IF $target = user:deleted {
                    fn::http(400, "The deleted user cannot be blocked.");
                };

                UPDATE userSettings SET
                    content.filters.blocked = array::union(content.filters.blocked, [$target])
                WHERE user = $user;

                IF record::tb($target) = "user" {
                    UPDATE $user SET
                        following = array::difference(following, [$target]),
                        followers = array::difference(followers, [$target]);
                    UPDATE $target SET
                        following = array::difference(following, [$user]),
                        followers = array::difference(followers, [$user]);
                }
                ELSE {
                    UPDATE $user SET
                        topics = array::difference(topics, [$target]);
                };

                RETURN true;
            `)
            .addTransaction()
            .addRecord("user", user)
            .addRecord("target", target)
            .queryValue<boolean>()
    }

    static async unblock(user: string, target: string): Promise<boolean> {
        this.validateTarget(target)
        return await new DatabaseQuery()
            .addSql(`
                UPDATE userSettings SET
                    content.filters.blocked = array::difference(content.filters.blocked, [$target])
                WHERE user = $user;

                RETURN true;
            `)
            .addTransaction()
            .addRecord("user", user)
            .addRecord("target", target)
            .queryValue<boolean>()
    }

    static async getFilteredTargets(viewer: User | null | undefined): Promise<string[]> {
        if (!viewer) return []

        const { muted, blocked, blockedBy } = await new DatabaseQuery()
            .addSql(`
                SELECT
                    content.filters.muted AS muted,
                    content.filters.blocked AS blocked,
                    (SELECT VALUE user FROM userSettings WHERE content.filters.blocked CONTAINS $viewer) AS blockedBy
                FROM userSettings
                WHERE user = $viewer
                LIMIT 1
            `)
            .addRecord("viewer", viewer.id)
            .queryOne<{ muted: string[], blocked: string[], blockedBy: string[] }>()

        return [...new Set([...muted, ...blocked, ...blockedBy])]
    }

    static async getBlockedUsers(viewer: User | null | undefined): Promise<string[]> {
        if (!viewer) return []

        const { blocked, blockedBy } = await new DatabaseQuery()
            .addSql(`
                SELECT
                    content.filters.blocked AS blocked,
                    (SELECT VALUE user FROM userSettings WHERE content.filters.blocked CONTAINS $viewer) AS blockedBy
                FROM userSettings
                WHERE user = $viewer
                LIMIT 1
            `)
            .addRecord("viewer", viewer.id)
            .queryOne<{ blocked: string[], blockedBy: string[] }>()

        return [...new Set([
            ...blocked.filter(target => target.startsWith("user:")),
            ...blockedBy,
        ])]
    }

    static async getBlockedTopics(viewer: User | null | undefined): Promise<string[]> {
        if (!viewer) return []

        const { blocked } = await new DatabaseQuery()
            .addSql(`
                SELECT content.filters.blocked AS blocked
                FROM userSettings
                WHERE user = $viewer
                LIMIT 1
            `)
            .addRecord("viewer", viewer.id)
            .queryOne<{ blocked: string[] }>()

        return blocked.filter(target => target.startsWith("topic:"))
    }

    static async isBlocked(user: string, target: string): Promise<boolean> {
        this.validateTarget(target)
        return await new DatabaseQuery()
            .addSql(`
                LET $matches = (
                    SELECT id
                    FROM userSettings
                    WHERE (
                        user = $user
                        AND (
                            (record::tb($target) = "user" AND content.filters.blocked CONTAINS $target)
                            OR (record::tb($target) = "topic" AND content.filters.blocked CONTAINS $target)
                        )
                    )
                    OR (
                        record::tb($target) = "user"
                        AND user = $target
                        AND content.filters.blocked CONTAINS $user
                    )
                    LIMIT 1
                );
                RETURN $matches.len() > 0;
            `)
            .addTransaction()
            .addRecord("user", user)
            .addRecord("target", target)
            .queryValue<boolean>()
    }

    private static toTargetView(target: { id: string, name?: string }): ContentFilterTargetView {
        const name = target.name ?? extractId(target.id)
        if (!name) throw new Error(`Invalid content filter target ID: ${target.id}`)
        return { id: target.id, name }
    }

    private static validateTarget(target: string): ContentFilterTargetType {
        const targetType = target.slice(0, target.indexOf(":"))
        if (targetType !== "user" && targetType !== "topic") {
            throw createError({
                statusCode: 400,
                statusMessage: "Only users and topics can be muted or blocked.",
            })
        }
        return targetType
    }
}