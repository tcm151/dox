import type { Voteable } from "@@/shared/types"
import { SettingsManager } from "@@/server/utils/SettingsManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    await SettingsManager.canVote("positive")
    const { id } = event.context.params!

    const item = await new DatabaseQuery()
        .addSql(`
            UPDATE $item SET
                votes.positive = array::union(votes.positive, [$user]),
                votes.misleading -= $user,
                votes.negative -= $user;
        `)
        .addRecord("item", id!)
        .addRecord("user", auth.id)
        .queryOne<Voteable>()

    return item.votes
})
