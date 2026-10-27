export interface NotificationOptions {
    recipient: string
    context: string
    message: string
}

export class NotificationManager {
    static async send({ recipient, context, message }: NotificationOptions): Promise<void> {
        await new DatabaseQuery()
            .addSql(`
                LET $settings = SELECT VALUE notifications.inApp
                FROM userSettings
                WHERE user = $recipient
                LIMIT 1;

                IF array::len($settings) = 0 OR $settings[0] = true {
                    CREATE notification SET
                        recipient = $recipient,
                        context = $context,
                        message = $message;
                };
            `)
            .addRecord("recipient", recipient)
            .addRecord("context", context)
            .addParameter("message", message)
            .execute()
    }
}