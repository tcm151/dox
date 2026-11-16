import type {
    User,
    UserSettings,
} from "@@/shared/types"
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

    static async list(user: string) {
        return await new DatabaseQuery()
            .addSql(`
                SELECT
                    content.filters.muted.{id, name: name ?? record::id(id)} AS muted,
                    content.filters.blocked.{id, name: name ?? record::id(id)} AS blocked
                FROM userSettings
                WHERE user = $user
            `)
            .addRecord("user", user)
            .queryOne<{
                muted: Array<{ id: string, name: string }>
                blocked: Array<{ id: string, name: string }>
            }>()
    }

    static async mute(user: string, target: string): Promise<boolean> {
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

        const { targets } = await new DatabaseQuery()
            .addSql(`
                SELECT array::group([
                    content.filters.muted,
                    content.filters.blocked,
                    (SELECT VALUE user FROM userSettings WHERE content.filters.blocked CONTAINS $viewer)
                ]) AS targets
                FROM userSettings
                WHERE user = $viewer
                LIMIT 1
            `)
            .addRecord("viewer", viewer.id)
            .queryOne<{ targets: string[] }>()

        return targets
    }

    static async isBlocked(viewer: User, target: string | string[], statusCode = 403): Promise<void> {
        const targets = Array.isArray(target) ? target : [target]
        if (targets.length === 0) return

        await new DatabaseQuery()
            .addSql(`
                LET $blocked = array::union(
                    (SELECT VALUE content.filters.blocked FROM ONLY userSettings WHERE user = $viewer LIMIT 1),
                    (SELECT VALUE user FROM userSettings WHERE content.filters.blocked CONTAINS $viewer)
                );
                LET $targets = array::group(array::flatten(array::map($targetIds, |$target| [
                    IF record::tb($target) IN ["user", "topic"] {
                        $target
                    }
                    ELSE {
                        (SELECT VALUE user FROM ONLY $target)
                    },
                    IF record::tb($target) = "thread" {
                        array::group([$target.topics, $target.replyTo.topics, $target.quote.topics])
                    }
                    ELSE IF record::tb($target) = "comment" {
                        array::group([$target.context.topics])
                    }
                    ELSE IF record::tb($target) IN ["post", "gallery", "link"] {
                        $target.topics
                    }
                    ELSE {
                        []
                    }
                ])));

                IF $targets CONTAINSANY $blocked {
                    fn::http($statusCode, "This action is blocked.");
                };
            `)
            .addTransaction()
            .addRecord("viewer", viewer.id)
            .addRecords("targetIds", targets)
            .addParameter("statusCode", statusCode)
            .execute()
    }

}