import { Post } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event);
    const post = await readBody(event)
    post.user = auth.id;
    post.votes.positive = [auth.id]

    var { sql, parameters } = queryBuilder()
    sql.push('CREATE post')
    sql.push('CONTENT $post')
    parameters['post'] = post
    const createdPost = await queryOne<Post>({ sql, parameters })

    var { sql, parameters } = queryBuilder()
    parameters['post'] = createdPost.id
    createdPost.topics.forEach((topic, i) => {
        sql.push(`UPDATE $topic${i} SET`)
        sql.push(`posts += $post;`)
        parameters[`topic${i}`] = topic
    })
    await multiQuery({ sql, parameters })

    return createdPost
})