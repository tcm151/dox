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

    await trashImage(id)
    return true
})