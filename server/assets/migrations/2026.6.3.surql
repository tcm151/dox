BEGIN TRANSACTION;

DEFINE FIELD OVERWRITE votes.awards ON comment
	TYPE array<record<user>> DEFAULT ALWAYS [];
UPDATE comment SET votes.awards = [] WHERE votes.awards IS NONE;

UPSERT migration SET version = '2026.6.3', time = time::now()
WHERE version = '2026.6.3';
COMMIT;