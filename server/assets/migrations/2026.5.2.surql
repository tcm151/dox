BEGIN TRANSACTION;

DEFINE TABLE IF NOT EXISTS migration SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS version ON migration
    TYPE string;
DEFINE FIELD IF NOT EXISTS time ON migration
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE INDEX IF NOT EXISTS version ON migration
    FIELDS version UNIQUE;

CREATE ONLY migration SET version = '2026.5.2';
COMMIT;