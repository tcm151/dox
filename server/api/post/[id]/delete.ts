import type { Post } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)

    const { id } = event.context.params!
    
    const { sql, parameters } = queryBuilder()
    sql.push('RETURN {')
    sql.push('IF $post.user != $user.id AND $user.roles CONTAINSNOT "admin" {')
    sql.push('THROW "You are not allowed to do this.";')
    sql.push('};')

    sql.push('FOR $topic IN $post.topics {')
    sql.push('UPDATE <record>$topic')
    sql.push('SET posts -= $post;')
    sql.push('};')
    
    // TODO add event log for all token transactions
    sql.push('FOR $image IN $post.images {')
    sql.push('UPDATE <record>$post.user SET')
    sql.push('tokens += $image.tokens;')
    sql.push('DELETE <record>$image;')
    sql.push('};')
    
    sql.push('DELETE <record>$post;')
    sql.push('};')

    parameters['post'] = `post:${id}`
    parameters['user'] = auth

    return await queryAll<string>({ 
        label: "Deleting a post",
        sql, parameters
     })
})