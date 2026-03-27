export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)    
    const { referral } = await readBody(event)

    // TODO need to limit the amount of time someone could use this
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
        .addRecord("user", `user:${referral}`)
        .addRecord("recipient", `user:${referral}`)
        .addRecord("context", auth.id)
        .addParameter("message", `**${auth.name}** used your referral\n> You gained 1024 free tokens. Don't forget to thank them!\n`)
        .queryOne<string>()
})
