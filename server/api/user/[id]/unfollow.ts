export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            RETURN {
                UPDATE $user SET
                following = array::difference(following, [$follower]);

                UPDATE $follower SET
                followers = array::difference(followers, [$user]);
                
                RETURN true;
            };
        `)
        .addRecord("user", auth.id)
        .addRecord("follower", `user:${id}`)
        .queryAll<boolean>()
})