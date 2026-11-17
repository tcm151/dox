export interface NotificationOptions {
    recipient: string
    context: string
    message: string
}

export class NotificationManager {
    static async send({ recipient, context, message }: NotificationOptions): Promise<void> {
        if (recipient === "user:deleted") return

        try {
            let html = await useStorage("assets:server").getItem("templates/notification.html") as string
            html = html.replace("{{notification.message}}", this.escapeHtml(message))

            await new DatabaseQuery()
                .addSql(`
                    LET $settings = (
                        SELECT VALUE notifications
                        FROM ONLY userSettings
                        WHERE user = $recipient
                        LIMIT 1
                    );

                    IF $settings.inApp {
                        CREATE notification SET
                            recipient = $recipient,
                            context = $context,
                            message = $message;
                    };

                    IF $settings.email {
                        LET $email = (
                            SELECT VALUE email
                            FROM ONLY account
                            WHERE user = $recipient
                            LIMIT 1
                        );
                        CREATE scheduledEmail SET
                            status = "pending",
                            recipient = $email,
                            subject = "Notification",
                            text = $message,
                            html = $html;
                    };
                `)
                .addTransaction()
                .addRecord("recipient", recipient)
                .addRecord("context", context)
                .addParameter("message", message)
                .addParameter("html", html)
                .execute()
        }
        catch (error) {
            console.error("Failed to create or queue notification.", { recipient, context, error })
        }
    }

    private static escapeHtml(value: string): string {
        return value.replace(/[&<>"']/g, character => {
            switch (character) {
                case "&": return "&amp;"
                case "<": return "&lt;"
                case ">": return "&gt;"
                case "\"": return "&quot;"
                case "'": return "&#39;"
                default: return character
            }
        })
    }
}