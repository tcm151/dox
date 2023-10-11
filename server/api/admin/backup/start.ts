import { Backup } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    
    if (!auth.admin) {
        throw createError({
            statusCode: 401,
            message: "You shall not pass!"
        })
    }
    
    const { sql, parameters } = queryBuilder()


    sql.push('LET $environment = $session.db;')
    sql.push('LET $comments = (SELECT * FROM comment);')
    sql.push('LET $drafts = (SELECT * FROM draft);')
    sql.push('LET $posts = (SELECT * FROM post);')
    sql.push('LET $topics = (SELECT * FROM topic);')
    sql.push('LET $users = (SELECT * FROM user);')
    
    sql.push('USE NS dox DB backup;')
    sql.push('INSERT INTO comment $comments;')
    sql.push('INSERT INTO draft $drafts;')
    sql.push('INSERT INTO post $posts;')
    sql.push('INSERT INTO topic $topics;')
    sql.push('INSERT INTO user $users;')
    
    sql.push('CREATE backup SET')
    sql.push('environment = $environment,')
    sql.push('time = time::now(),')
    sql.push('user = $user.id')
    parameters['user'] = auth

    return await queryAll<Backup>({ sql, parameters })
})