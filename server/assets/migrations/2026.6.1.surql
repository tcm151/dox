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
DEFINE FIELD OVERWRITE context ON notification
	TYPE record<post|comment|user|thread|gallery|image>;

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

DEFINE TABLE OVERWRITE feed AS
SELECT id, id AS sourceId, time,
    fn::calculate_score(votes.positive, votes.misleading, votes.negative, visits) AS score,
    user, topics
FROM post, thread, gallery
WHERE IF id IS NONE THEN false ELSE (
    (record::tb(id) = 'post' AND status = 'active')
    OR (record::tb(id) = 'thread' AND replyTo = NONE AND status = 'active')
    OR (record::tb(id) = 'gallery' AND status = 'active')
) END;
DEFINE FIELD OVERWRITE hot ON feed
    COMPUTED fn::sort_hot(score, time, time::now());

LET $postFields = (INFO FOR TABLE post).fields;
IF $postFields.archived != NONE {
	DEFINE FIELD OVERWRITE status ON post TYPE option<string>;
	UPDATE post SET status = IF archived = true THEN "archived" ELSE "active" END;
	REMOVE FIELD archived ON post;
};
DEFINE FIELD OVERWRITE status ON post
	TYPE string ASSERT $value IN ["active", "archived", "quarantined", "deleted"] DEFAULT ALWAYS "active";

LET $threadFields = (INFO FOR TABLE thread).fields;
IF $threadFields.archived != NONE {
	DEFINE FIELD OVERWRITE status ON thread TYPE option<string>;
	UPDATE thread SET status = IF archived = true THEN "archived" ELSE "active" END;
	REMOVE FIELD archived ON thread;
};
DEFINE FIELD OVERWRITE status ON thread
	TYPE string ASSERT $value IN ["active", "archived", "quarantined", "deleted"] DEFAULT ALWAYS "active";

LET $galleryFields = (INFO FOR TABLE gallery).fields;
IF $galleryFields.archived != NONE {
	DEFINE FIELD OVERWRITE status ON gallery TYPE option<string>;
	UPDATE gallery SET status = IF archived = true THEN "archived" ELSE "active" END;
	REMOVE FIELD archived ON gallery;
};
DEFINE FIELD OVERWRITE status ON gallery
	TYPE string ASSERT $value IN ["active", "archived", "quarantined", "deleted"] DEFAULT ALWAYS "active";

LET $imageFields = (INFO FOR TABLE image).fields;
IF $imageFields.public != NONE {
	DEFINE FIELD OVERWRITE status ON image TYPE option<string>;
	UPDATE image SET status = "active";
	REMOVE FIELD public ON image;
};
DEFINE FIELD OVERWRITE status ON image
	TYPE string ASSERT $value IN ["active", "archived", "quarantined", "deleted"] DEFAULT ALWAYS "active";

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