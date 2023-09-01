export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    var { sql, parameters } = queryBuilder()
    sql.push('UPDATE $user SET')
    sql.push('following = array::union(following, [$follower]);')
    sql.push('UPDATE $follower SET')
    sql.push('followers = array::union(followers, [$user]);')
    parameters['user'] = auth.id
    parameters['follower'] = `user:${id}`
    await multiQuery({ sql, parameters })
    
    return true
})