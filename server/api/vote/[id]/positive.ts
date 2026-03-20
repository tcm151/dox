import type { Voteable } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    const item = await new DatabaseQuery()
        .addSql(`
            UPDATE $item SET
            votes.positive = array::union(votes.positive, [$user]),
            votes.misleading -= $user,
            votes.negative -= $user
        `)
        .addRecordId("item", id!)
        .addRecordId("user", auth.id)
        .queryOne<Voteable>()

    return item.votes
})
