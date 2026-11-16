import { Validator } from "@@/shared/utils/Validator"
import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const body = await readBody<{ target: string }>(event)

    new Validator("ContentFilter")
        .string(body.target, "target")
        .match(body.target, "record.id", "target")
        .confirm()

    return await UserSettingsManager.unblock(auth.id, body.target)
})
