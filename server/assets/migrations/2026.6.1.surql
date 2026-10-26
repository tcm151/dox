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

COMMIT;

DEFINE INDEX IF NOT EXISTS reportSubject ON TABLE report
	FIELDS subject UNIQUE;

BEGIN TRANSACTION;
UPSERT migration SET version = '2026.6.1', time = time::now()
WHERE version = '2026.6.1';
COMMIT;