BEGIN TRANSACTION;

-- Reshape report records around computed ownership and history-based moderation.
DEFINE FIELD OVERWRITE owner ON report
	COMPUTED IF subject.user != NONE THEN subject.user.{ id, name } ELSE subject.{ id, name } END;
DEFINE FIELD OVERWRITE topics ON report
	COMPUTED IF subject.topics != NONE THEN subject.topics ELSE [] END;
DEFINE FIELD OVERWRITE moderator ON report
	TYPE option<record<user>>;
DEFINE FIELD OVERWRITE time ON report
	TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD OVERWRITE complaints ON report
	TYPE array<object> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE complaints.*.user ON report
	TYPE record<user>;
DEFINE FIELD OVERWRITE complaints.*.reason ON report
	TYPE string;
DEFINE FIELD OVERWRITE complaints.*.time ON report
	TYPE datetime;
DEFINE FIELD OVERWRITE status ON report
	TYPE string ASSERT $value IN ["pending", "removed", "appealed", "denied", "closed"] DEFAULT ALWAYS "pending";
DEFINE FIELD OVERWRITE history ON report
	TYPE array<object> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE history.*.action ON report
	TYPE string;
DEFINE FIELD OVERWRITE history.*.message ON report
	TYPE option<string> ASSERT $value.len() > 0;
DEFINE FIELD OVERWRITE history.*.user ON report
	TYPE record<user>;
DEFINE FIELD OVERWRITE history.*.time ON report
	TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD OVERWRITE history.*.changes ON report
	TYPE object FLEXIBLE;

REMOVE FIELD IF EXISTS complaints.*.reporter ON report;
REMOVE FIELD IF EXISTS resolution ON report;
REMOVE FIELD IF EXISTS appeal.reason ON report;
REMOVE FIELD IF EXISTS appeal.time ON report;
REMOVE FIELD IF EXISTS appeal.moderator ON report;
REMOVE FIELD IF EXISTS appeal ON report;
REMOVE FIELD IF EXISTS author ON report;

-- Extend notification targets and persist moderator actions from report/request history.
DEFINE FIELD OVERWRITE context ON notification
	TYPE record<post|comment|user|thread|gallery|image|report|topic>;

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
	WHEN $event = 'UPDATE' AND $after.history.len() > $before.history.len()
	THEN {
		LET $entry = array::last($after.history);
		CREATE moderatorLog SET
			actor = $entry.user,
			action = $entry.action,
			target = $after.id,
			details = {
				before: { status: $entry.changes.status.before },
				after: { status: $entry.changes.status.after, message: $entry.message },
				topic: $entry.changes.topic,
				changes: $entry.changes
			};
	};
DEFINE EVENT OVERWRITE moderatorLogRequestApproval ON moderationRequest
	WHEN $event = 'UPDATE' AND $after.approvals.len() > $before.approvals.len()
	THEN {
		CREATE moderatorLog SET
			actor = array::last($after.approvals),
			action = 'moderation.request.approved',
			target = $after.id,
			details = { topic: $after.topic, applicant: $after.user };
	};
DEFINE EVENT OVERWRITE moderatorLogRequestDenial ON moderationRequest
	WHEN $event = 'UPDATE' AND $after.denials.len() > $before.denials.len()
	THEN {
		CREATE moderatorLog SET
			actor = array::last($after.denials),
			action = 'moderation.request.denied',
			target = $after.id,
			details = { topic: $after.topic, applicant: $after.user };
	};

-- Keep per-user settings aligned with the UI and in-app notification preferences.
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

-- Replace the legacy report index with the canonical unique subject index.
REMOVE INDEX IF EXISTS reportSubject ON TABLE report;
DEFINE INDEX OVERWRITE subject ON TABLE report
	FIELDS subject UNIQUE;

-- Rebuild the feed against content status before removing legacy visibility fields.
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

-- Convert archived flags to active/archived statuses for posts, threads, and galleries.
LET $postFields = (INFO FOR TABLE post).fields;
DEFINE FIELD OVERWRITE archived ON post TYPE option<bool>;
IF $postFields.archived != NONE {
	DEFINE FIELD OVERWRITE status ON post TYPE option<string>;
	UPDATE post SET status = IF archived = true THEN "archived" ELSE "active" END;
};
UPDATE post UNSET archived;
REMOVE FIELD archived ON post;
DEFINE FIELD OVERWRITE status ON post
	TYPE string ASSERT $value IN ["active", "archived", "quarantined", "deleted"] DEFAULT ALWAYS "active";

LET $threadFields = (INFO FOR TABLE thread).fields;
DEFINE FIELD OVERWRITE archived ON thread TYPE option<bool>;
IF $threadFields.archived != NONE {
	DEFINE FIELD OVERWRITE status ON thread TYPE option<string>;
	UPDATE thread SET status = IF archived = true THEN "archived" ELSE "active" END;
};
UPDATE thread UNSET archived;
REMOVE FIELD archived ON thread;
DEFINE FIELD OVERWRITE status ON thread
	TYPE string ASSERT $value IN ["active", "archived", "quarantined", "deleted"] DEFAULT ALWAYS "active";

LET $galleryFields = (INFO FOR TABLE gallery).fields;
DEFINE FIELD OVERWRITE archived ON gallery TYPE option<bool>;
IF $galleryFields.archived != NONE {
	DEFINE FIELD OVERWRITE status ON gallery TYPE option<string>;
	UPDATE gallery SET status = IF archived = true THEN "archived" ELSE "active" END;
};
UPDATE gallery UNSET archived;
REMOVE FIELD archived ON gallery;
DEFINE FIELD OVERWRITE status ON gallery
	TYPE string ASSERT $value IN ["active", "archived", "quarantined", "deleted"] DEFAULT ALWAYS "active";

-- Replace image visibility with the unified content status.
LET $imageFields = (INFO FOR TABLE image).fields;
DEFINE FIELD OVERWRITE public ON image TYPE option<bool>;
IF $imageFields.public != NONE {
	DEFINE FIELD OVERWRITE status ON image TYPE option<string>;
	UPDATE image SET status = "active";
};
UPDATE image UNSET public;
REMOVE FIELD public ON image;
DEFINE FIELD OVERWRITE status ON image
	TYPE string ASSERT $value IN ["active", "archived", "quarantined", "deleted"] DEFAULT ALWAYS "active";

-- Ensure every existing user has settings while preserving their stored UI preferences.
FOR $user IN (SELECT VALUE id FROM user) {
	UPSERT userSettings SET
		user = $user,
		ui = {
			hoverAnimations: ui.hoverAnimations ?? true,
			hintDuration: ui.hintDuration ?? 2500
		}
	WHERE user = $user;
};

-- Record completion only after the schema, backfills, and feed update succeed.
UPSERT migration SET version = '2026.6.1', time = time::now()
WHERE version = '2026.6.1';
COMMIT;