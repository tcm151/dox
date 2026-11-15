import type { UserSettings } from "@@/shared/types"
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
                    content = $content,
                    ui = $ui
                WHERE user = $user
            `)
            .addRecord("user", user)
            .addParameter("notifications", settings.notifications)
            .addParameter("ui", settings.ui)
            .addParameter("content", settings.content)
            .queryOne<UserSettings>()
    }
}