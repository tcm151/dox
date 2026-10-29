import { NotificationManager } from "@@/server/utils/repos/NotificationManager"

interface ModeratorApproval {
    user: string
    topic: string
}

export class ModeratorRequestManager {
    static async sendApprovalNotification(approval: ModeratorApproval) {
        await NotificationManager.send({
            recipient: approval.user,
            context: approval.topic,
            message: "Your request to moderate this topic was approved.",
        })
    }

    static async reconcile(threshold: number) {
        const approvedRequests = await new DatabaseQuery()
            .addSql(`
                LET $approvedRequests = (
                    SELECT id, user, topic
                    FROM moderationRequest
                    WHERE closed = false
                    AND approvals.len() >= $threshold
                    AND approvals.len() > denials.len()
                );

                FOR $request IN $approvedRequests {
                    UPDATE $request.topic SET
                        moderators += $request.user
                    WHERE moderators CONTAINSNOT $request.user;

                    IF $request.user.roles CONTAINSNOT "moderator" {
                        UPDATE $request.user SET
                            roles += "moderator";
                    };

                    UPDATE $request.id SET
                        closed = true;
                };

                UPDATE moderationRequest SET
                    closed = true
                WHERE closed = false
                AND denials.len() >= $threshold
                AND denials.len() > approvals.len();

                RETURN { approvals: $approvedRequests };
            `)
            .addTransaction()
            .addParameter("threshold", threshold)
            .queryValue<{ approvals: ModeratorApproval[] }>()

        await Promise.all(approvedRequests.approvals.map(approval => this.sendApprovalNotification(approval)))
    }
}