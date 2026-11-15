import { Validator } from "@@/shared/utils/Validator"
import { linkPreviewManager, UnsafeLinkPreviewTarget } from "@@/server/utils/LinkPreviewManager"

type LinkPreviewRequest = {
    url: string
}

export default defineEventHandler(async (event) => {
    await authenticateRequest(event)
    const request = await readBody<LinkPreviewRequest>(event)

    new Validator("LinkPreview")
        .url(request.url, "url", { maxLength: 2048 })
        .confirm()

    try {
        return await linkPreviewManager.get(request.url)
    }
    catch (error) {
        if (error instanceof UnsafeLinkPreviewTarget) {
            throw createError({ statusCode: 400, statusMessage: error.message })
        }
        return {}
    }
})