export default defineEventHandler(async (event) => {
    const { id } = await readBody<{ id: string }>(event)

    return await new DatabaseQuery()
        .addSql(`
            IF $confirmation.expired {
                fn::http(410, "Confirmation period has expired, please try again and complete within 15 minutes.");
            };
            IF $confirmation.used {
                fn::http(409, "This confirmation has already been used.");
            };

            UPDATE $confirmation.account.user SET
                traits = array::union(traits, ["confirmed"]);

            UPDATE $confirmation SET
                used = true;
        `)
        .addTransaction()
        .addRecord('confirmation', id)
        .execute()
})
