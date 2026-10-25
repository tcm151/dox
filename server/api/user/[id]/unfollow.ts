export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            UPDATE $user SET
                following = array::difference(following, [$follower]);

            UPDATE $follower SET
                followers = array::difference(followers, [$user]);

            RETURN true;
        `)
        .addTransaction()
        .addRecord("user", auth.id)
        .addRecord("follower", `user:${id}`)
        .queryValue<boolean>()
})