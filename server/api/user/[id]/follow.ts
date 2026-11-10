export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            IF $follower = user:deleted {
                fn::http(409, "Deleted users cannot be followed.");
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
        .queryValue<boolean>()
})