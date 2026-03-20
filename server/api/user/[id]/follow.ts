export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            RETURN {
                UPDATE $user SET
                following = array::union(following, [$follower]);
                
                UPDATE $follower SET
                followers = array::union(followers, [$user]);
                
                RETURN true;
            };
        `)
        .addRecord("user", auth.id)
        .addRecord("follower", `user:${id}`)
        .queryAll<boolean>()
})