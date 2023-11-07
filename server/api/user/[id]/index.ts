import type { Post, User } from "~/types";

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!
    
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, name, link, description, dateCreated, votes, followers, following, topics')
    sql.push('FROM $user')
    parameters['user'] = `user:${id}`
    const user = await queryOne<User>({ sql, parameters })

    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, user.id, user.name, title, time, replyTo.id, replyTo.title, topics, comments, votes')
    sql.push('FROM post')
    sql.push('WHERE user = $user')
    sql.push('ORDER BY time DESC')
    sql.push('FETCH user')
    parameters['user'] = `user:${id}`
    const posts = await queryAll<Post>({ sql, parameters })

    return { user, posts }
})