import type { UserSettings } from "@@/shared/types"
import { Validator } from "@@/shared/utils/validation"

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
            })
            .object(settings.ui, "UI preferences", v => {
                v.boolean(settings.ui.hoverAnimations, "Hover animations")
                v.number(settings.ui.hintDuration, "Hint duration")
            })
            .confirm()

        return await new DatabaseQuery()
            .addSql(`
                UPDATE userSettings SET
                    notifications = $notifications,
                    ui = $ui
                WHERE user = $user
            `)
            .addRecord("user", user)
            .addParameter("notifications", settings.notifications)
            .addParameter("ui", settings.ui)
            .queryOne<UserSettings>()
    }
}