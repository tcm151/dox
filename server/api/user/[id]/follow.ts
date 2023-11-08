export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    let { sql, parameters } = queryBuilder()

    sql.push('RETURN {')

    sql.push('UPDATE $user SET')
    sql.push('following = array::union(following, [$follower]);')
    
    sql.push('UPDATE $follower SET')
    sql.push('followers = array::union(followers, [$user]);')
    
    sql.push('RETURN true;')
    sql.push('};')

    parameters['user'] = auth.id
    parameters['follower'] = `user:${id}`
    
    return await queryAll<boolean>({ sql, parameters })
})