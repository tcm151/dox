import type { Link } from "@@/shared/types"
import { Validator } from "@@/shared/utils/Validator"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!
    const body = await readBody<{ description: string }>(event)

    new Validator("Link")
        .string(body.description, "description", { maxLength: 256 })
        .confirm()

    return await new DatabaseQuery()
        .addSql(`
            IF $link.user != $user {
                fn::http(403, "You are not the author of this link.");
            };

            UPDATE $link SET
                description = $description,
                edited = true,
                timeEdited = time::now();
        `)
        .addTransaction()
        .addRecord("link", `link:${id}`)
        .addRecord("user", auth.id)
        .addParameter("description", body.description)
        .queryOne<Link>()
})