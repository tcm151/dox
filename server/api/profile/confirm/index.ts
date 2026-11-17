import { parseRecordId } from "@@/shared/utils/records"

export default defineEventHandler(async (event) => {
    const body = await readBody<{ id: string }>(event)
    const id = body?.id
    const record = typeof id === "string" ? parseRecordId(id) : undefined

    if (record?.table !== "accountConfirmation") {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid confirmation token.",
        })
    }

    return await new DatabaseQuery()
        .addSql(`
            IF !record::exists($confirmation) {
                fn::http(400, "Invalid confirmation token.");
            };
            IF $confirmation.expired {
                fn::http(410, "Confirmation period has expired, please try again and complete within 15 minutes.");
            };
            IF $confirmation.used {
                fn::http(409, "This confirmation has already been used.");
            };
            IF !record::exists($confirmation.account) {
                fn::http(400, "Confirmation account is unavailable.");
            };
            IF !record::exists($confirmation.account.user) {
                fn::http(400, "Confirmation account is unavailable.");
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
