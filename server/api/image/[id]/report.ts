import type { Image } from "~/types"

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
        .addRecordId("image", `image:${id}`)
        .addRecordId("user", auth.id)
        .queryOne<Image>()
})