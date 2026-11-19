BEGIN TRANSACTION;

-- Record the 2026.6.4 release version without changing schema or data.
UPSERT migration SET version = '2026.6.4', time = time::now()
WHERE version = '2026.6.4';
COMMIT;