import type { Image } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            CREATE report SET
            subject = $image,
            reporter = $user,
            time = time::now()
        `)
        .addRecord("image", `image:${id}`)
        .addRecord("user", auth.id)
        .queryOne<Image>()
})