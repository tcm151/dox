import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!
    const blockedUsers = await UserSettingsManager.getBlockedUsers(auth)

    return await new DatabaseQuery()
        .addSql(`
            IF $follower = user:deleted {
                fn::http(409, "Deleted users cannot be followed.");
            };
            IF $blockedUsers.len() > 0 AND $blockedUsers CONTAINS $follower {
                fn::http(403, "Users cannot follow each other while either user blocks the other.");
            };

            UPDATE $user SET
                following = array::union(following, [$follower]);

            UPDATE $follower SET
                followers = array::union(followers, [$user]);

            RETURN true;
        `)
        .addTransaction()
        .addRecord("user", auth.id)
        .addRecord("follower", `user:${id}`)
        .addRecords("blockedUsers", blockedUsers)
        .queryValue<boolean>()
})