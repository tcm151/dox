BEGIN TRANSACTION;

DEFINE FIELD OVERWRITE reporter ON report
	TYPE option<record<user>>;
DEFINE FIELD OVERWRITE reason ON report
	TYPE option<string>;
DEFINE FIELD OVERWRITE complaints ON report
	TYPE array<object>;
DEFINE FIELD IF NOT EXISTS complaints.*.reporter ON report
	TYPE record<user>;
DEFINE FIELD IF NOT EXISTS complaints.*.reason ON report
	TYPE string;
DEFINE FIELD IF NOT EXISTS complaints.*.time ON report
	TYPE datetime;
DEFINE FIELD OVERWRITE status ON report
	TYPE string ASSERT $value IN ["pending", "resolved", "removed"] DEFAULT ALWAYS "pending";
DEFINE FIELD OVERWRITE resolution ON report
	TYPE option<string> ASSERT $value = NONE OR $value.len() >= 3;
DEFINE FIELD IF NOT EXISTS moderator ON report
	TYPE option<record<user>>;

DEFINE TABLE IF NOT EXISTS moderatorLog SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS actor ON moderatorLog
	TYPE record<user>;
DEFINE FIELD IF NOT EXISTS action ON moderatorLog
	TYPE string;
DEFINE FIELD IF NOT EXISTS target ON moderatorLog
	TYPE record;
DEFINE FIELD IF NOT EXISTS details ON moderatorLog
	TYPE object FLEXIBLE DEFAULT {};
DEFINE FIELD IF NOT EXISTS time ON moderatorLog
	TYPE datetime DEFAULT ALWAYS time::now();
DEFINE INDEX IF NOT EXISTS moderatorLogTime ON TABLE moderatorLog
	FIELDS time;
DEFINE INDEX IF NOT EXISTS moderatorLogActor ON TABLE moderatorLog
	FIELDS actor;
DEFINE INDEX IF NOT EXISTS moderatorLogTarget ON TABLE moderatorLog
	FIELDS target;

DEFINE EVENT OVERWRITE moderatorLogReportUpdate ON report
	WHEN $event = 'UPDATE' AND $after.moderator != NONE
	THEN {
		IF $before.status != $after.status OR $before.resolution != $after.resolution {
			LET $action = IF $before.status = $after.status THEN
				'report.resolution_updated'
			ELSE IF $after.status = 'resolved' THEN
				'report.resolved'
			ELSE IF $after.status = 'removed' THEN
				'report.removed'
			ELSE
				'report.reopened'
			END;

			CREATE moderatorLog SET
				actor = $after.moderator,
				action = $action,
				target = $after.id,
				details = {
					before: { status: $before.status, resolution: $before.resolution },
					after: { status: $after.status, resolution: $after.resolution }
				};
		};
	};
DEFINE EVENT OVERWRITE moderatorLogRequestApproval ON moderationRequest
	WHEN $event = 'UPDATE' AND $after.approvals.len() > $before.approvals.len()
	THEN {
		CREATE moderatorLog SET
			actor = array::last($after.approvals),
			action = 'moderation_request.approved',
			target = $after.id,
			details = { topic: $after.topic, applicant: $after.user };
	};
DEFINE EVENT OVERWRITE moderatorLogRequestDenial ON moderationRequest
	WHEN $event = 'UPDATE' AND $after.denials.len() > $before.denials.len()
	THEN {
		CREATE moderatorLog SET
			actor = array::last($after.denials),
			action = 'moderation_request.denied',
			target = $after.id,
			details = { topic: $after.topic, applicant: $after.user };
	};

UPDATE report SET resolution = NONE WHERE resolution = "NONE";

UPDATE report SET complaints = [{ reporter: reporter, reason: reason ?? "NONE", time: time }]
WHERE complaints IS NONE;

-- Consolidate old per-submission rows under one report per subject.
LET $groups = SELECT subject, array::group(id) AS ids FROM report GROUP BY subject;
FOR $group IN $groups {
	LET $canonical = $group.ids[0];
	FOR $duplicate IN $group.ids[1..] {
		UPDATE $canonical SET complaints += $duplicate.complaints, time = $duplicate.time;
		DELETE $duplicate;
	};
};

UPDATE report UNSET reporter, reason;
REMOVE FIELD reporter ON report;
REMOVE FIELD reason ON report;
DEFINE FIELD OVERWRITE complaints ON report
	TYPE array<object> DEFAULT ALWAYS [];
UPDATE report SET status = "pending" WHERE status IS NONE;

DEFINE TABLE OVERWRITE userSettings SCHEMAFULL;
DEFINE FIELD OVERWRITE user ON userSettings
	TYPE record<user>;
DEFINE INDEX OVERWRITE userSettingsUser ON TABLE userSettings
	FIELDS user UNIQUE;
DEFINE FIELD OVERWRITE ui ON userSettings
	TYPE object DEFAULT ALWAYS { hoverAnimations: true, hintDuration: 2500 };
DEFINE FIELD OVERWRITE ui.hoverAnimations ON userSettings
	TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD OVERWRITE ui.hintDuration ON userSettings
	TYPE number DEFAULT ALWAYS 2500;
DEFINE FIELD OVERWRITE notifications ON userSettings
	TYPE object DEFAULT ALWAYS { inApp: true };
DEFINE FIELD OVERWRITE notifications.inApp ON userSettings
	TYPE bool DEFAULT ALWAYS true;

COMMIT;

DEFINE INDEX IF NOT EXISTS reportSubject ON TABLE report
	FIELDS subject UNIQUE;

BEGIN TRANSACTION;
FOR $user IN (SELECT VALUE id FROM user) {
	UPSERT userSettings SET
		user = $user,
		ui = {
			hoverAnimations: ui.hoverAnimations ?? true,
			hintDuration: ui.hintDuration ?? 2500
		}
	WHERE user = $user;
};

UPSERT migration SET version = '2026.6.1', time = time::now()
WHERE version = '2026.6.1';
COMMIT;