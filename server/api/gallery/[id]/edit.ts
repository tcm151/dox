import type { Gallery } from "@@/shared/types"
import { Validator } from "@@/shared/utils/Validator"

interface EditGalleryRequest {
    description: string
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!
    const body = await readBody<EditGalleryRequest>(event)

    new Validator("Gallery")
        .string(body.description, "description", { maxLength: 256 })
        .confirm()

    return await new DatabaseQuery()
        .addSql(`
            IF $gallery.user != $user {
                RETURN fn::http(403, "You are not the author of this gallery.")
            }

            UPDATE $gallery SET
                description = $description;
        `)
        .addTransaction()
        .addRecord("gallery", `gallery:${id}`)
        .addRecord("user", auth.id)
        .addParameter("description", body.description)
        .queryOne<Gallery>()
})