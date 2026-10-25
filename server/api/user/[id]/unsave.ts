import type { User } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const subscriber = await authenticateRequest(event)
    const { id } = event.context.params!
    const targetId = `user:${id}`

    const target = await new DatabaseQuery()
        .addSql(`
            SELECT id FROM $target;
        `)
        .addRecord("target", targetId)
        .queryOne<Pick<User, "id">>()

    if (target.id === subscriber.id) {
        throw createError({ statusCode: 400, statusMessage: "You cannot unsave yourself." })
    }

    await new DatabaseQuery()
        .addSql(`
            IF $target.votes.saves CONTAINS $subscriber {
                UPDATE $target SET
                    votes.saves = array::difference(votes.saves, [$subscriber]);
            };
        `)
        .addRecord("target", targetId)
        .addRecord("subscriber", subscriber.id)
        .execute()

    return { saved: false }
})