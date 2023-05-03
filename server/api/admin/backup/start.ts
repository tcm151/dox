import { multiQuery, queryAll } from "~/server/database"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    if (!auth.admin) {
        throw createError({
            statusCode: 401,
            message: "You shall not pass!"
        })
    }
    return await queryAll<any>([`
        LET $comments = (SELECT * FROM comment);
        LET $drafts = (SELECT * FROM draft);
        LET $posts = (SELECT * FROM post);
        LET $topics = (SELECT * FROM topic);
        LET $users = (SELECT * FROM user);
        
        USE NS dox DB backup;
        
        INSERT INTO comment $comments;
        INSERT INTO draft $drafts;
        INSERT INTO post $posts;
        INSERT INTO topic $topics;
        INSERT INTO user $users;
        CREATE backup SET
        time = time::now(),
        user = ${auth.id}
    `])
    return true
})