import type { Backup } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    if (!hasRole(auth, "developer")) {
        throw createError({
            statusCode: 401,
            message: "You shall not pass!"
        })
    }

    return await new DatabaseQuery()
        .addSql(`
            RETURN {
                LET $environment = $session.db;
                LET $comments = (SELECT * FROM comment);
                LET $drafts = (SELECT * FROM draft);
                LET $posts = (SELECT * FROM post);
                LET $threads = (SELECT * FROM thread);
                LET $topics = (SELECT * FROM topic);
                LET $users = (SELECT * FROM user);

                USE NS ${useRuntimeConfig().surreal.namespace} DB backup;
                INSERT INTO comment $comments;
                INSERT INTO draft $drafts;
                INSERT INTO post $posts;
                INSERT INTO thread $threads;
                INSERT INTO topic $topics;
                INSERT INTO user $users;
    
                RETURN CREATE backup SET
                environment = $environment,
                time = time::now(),
                user = $user.id
            }
        `)
        .addParameter('user', auth)
        .queryOne<Backup>()
})