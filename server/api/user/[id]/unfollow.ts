export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            IF $user.following CONTAINS $follower {
                UPDATE $user SET
                    following = array::difference(following, [$follower]);
            };

            IF $follower.followers CONTAINS $user {
                UPDATE $follower SET
                    followers = array::difference(followers, [$user]);
            };

            RETURN true;
        `)
        .addTransaction()
        .addRecord("user", auth.id)
        .addRecord("follower", `user:${id}`)
        .queryValue<boolean>()
})