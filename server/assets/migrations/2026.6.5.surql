BEGIN TRANSACTION;

-- Record the 2026.6.5 release version without changing schema or data.
UPSERT migration SET version = '2026.6.5', time = time::now()
WHERE version = '2026.6.5';
COMMIT;