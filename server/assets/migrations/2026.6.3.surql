BEGIN TRANSACTION;

-- include migrations here

UPSERT migration SET version = '2026.6.3', time = time::now()
WHERE version = '2026.6.3';
COMMIT;