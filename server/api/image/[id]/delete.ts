import type { Image } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    if (!id) {
        throw createError({
            status: 400,
            statusText: "Image ID is required.",
        })
    }

    const image = await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM $image
        `)
        .addRecord("image", `image:${id}`)
        .queryOne<Image>()

    if (image.user != auth.id && !hasRole(auth, "admin")) {
        throw createError({
            status: 403,
            statusText: `You are not allowed to do this.`,
        })
    }

    try {
        await trashImage(id)
        return true
    }
    catch (error: any) {
        const imageIsAttached = error.message.includes("Image is still attached to content.")
        throw createError({
            status: imageIsAttached ? 409 : 500,
            statusText: imageIsAttached ? "This image is still attached to content." : `Unable to delete image:${id}`,
            message: error.message,
            stack: error.stack,
        })      
    }
})