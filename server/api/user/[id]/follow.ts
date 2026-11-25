import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    await UserSettingsManager.isBlocked(auth, `user:${id}`)

    return await new DatabaseQuery()
        .addSql(`
            IF $follower = user:deleted {
                fn::http(409, "Deleted users cannot be followed.");
            };
            UPDATE $user SET
                following = array::union(following, [$follower]);

            UPDATE $follower SET
                followers = array::union(followers, [$user]),
                votes.positive = array::union(votes.positive, [$user]);

            RETURN true;
        `)
        .addTransaction()
        .addRecord("user", auth.id)
        .addRecord("follower", `user:${id}`)
        .queryValue<boolean>()
})