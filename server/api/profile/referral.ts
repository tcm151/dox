export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)    
    const { referral } = await readBody(event)

    const { sql, parameters } = queryBuilder()
    sql.push('IF $user != NONE THEN')
    sql.push('(UPDATE $user SET tokens += 1024)')
    sql.push('END;')
    parameters['user'] = `user:${referral}`
    
    sql.push('CREATE notification SET')
    sql.push('recipient = $user,')
    sql.push('context = $context,')
    sql.push('message = $message,')
    sql.push('time = time::now(),')
    sql.push('viewed = false;')
    parameters['recipient'] = `user:${referral}`
    parameters['context'] = auth.id
    parameters['message'] = [
        `**${auth.name}** used your referral`,
        `> You gained 1024 free tokens. Don't forget to thank them!\n`,
    ].join('\n')
    
    return await multiQuery({ sql, parameters })
})
