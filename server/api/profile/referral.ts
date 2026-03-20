export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)    
    const { referral } = await readBody(event)

    return await new DatabaseQuery()
        .addSql(`
            RETURN {
                IF $user != NONE {
                    UPDATE $user SET tokens += 1024;
                };
                
                CREATE notification SET
                recipient = $recipient,
                context = $context,
                message = $message;

                RETURN "Referral completed successfully.";
            };
        `)
        .addRecordId("user", `user:${referral}`)
        .addRecordId("recipient", `user:${referral}`)
        .addRecordId("context", auth.id)
        .addParameter("message", [
            `**${auth.name}** used your referral`,
            `> You gained 1024 free tokens. Don't forget to thank them!\n`,
        ].join('\n'))
        .queryAll<string>()
})
