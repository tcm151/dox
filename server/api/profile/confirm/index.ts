export default defineEventHandler(async (event) => {
    const { id } = await readBody<{ id: string }>(event)

    return await new DatabaseQuery()
        .addSql(`
            RETURN {
                IF $confirmation.expired {
                    THROW "Confirmation period has expired, please try again and complete within 15 minutes."
                };

                IF $confirmation.used {
                    THROW "This confirmation has already been used.";
                };

                UPDATE $confirmation.user SET
                traits = array::union(traits, ["confirmed"]);
                UPDATE $confirmation SET
                used = true;
                
                RETURN $confirmation.user.traits;
            };
        `)
        .addRecord('confirmation', id)
        .queryOne<boolean>()
})
