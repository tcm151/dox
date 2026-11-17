import type { Voteable } from "@@/shared/types"
import { SettingsManager } from "@@/server/utils/SettingsManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    await SettingsManager.canVote("misleading")
    const { id } = event.context.params!

    const item = await new DatabaseQuery()
        .addSql(`
            UPDATE $item SET
            votes.positive -= $user,
            votes.misleading = array::union(votes.misleading, [$user]),
            votes.negative -= $user;
            // visits += 1;
        `)
        .addRecord("item", id!)
        .addRecord("user", auth.id)
        .queryOne<Voteable>()

    return item.votes
})
