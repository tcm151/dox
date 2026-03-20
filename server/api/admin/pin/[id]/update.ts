import type { Pin } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])

    const { id } = event.context.params!
    const { active } = await readBody<{ active: boolean }>(event)

    const pin =  await new DatabaseQuery()
        .addSql(`
            UPDATE $pin SET
            active = $active
        `)
        .addRecordId("pin", `pin:${id}`)
        .addParameter("active", active)
        .queryOne<Pin>()

    return pin.active
})