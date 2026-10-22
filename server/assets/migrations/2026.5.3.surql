BEGIN TRANSACTION;

DEFINE TABLE IF NOT EXISTS mediaTrash SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS type ON mediaTrash
    TYPE string;
DEFINE FIELD IF NOT EXISTS extension ON mediaTrash
    TYPE string;
DEFINE FIELD IF NOT EXISTS time ON mediaTrash
    TYPE datetime DEFAULT ALWAYS time::now();

DEFINE FIELD IF NOT EXISTS description ON image
    TYPE string DEFAULT ALWAYS "";
DEFINE FIELD IF NOT EXISTS topics ON image
    TYPE array<record<topic>> DEFAULT ALWAYS [];
UPDATE image SET description = "", topics = [];

CREATE ONLY migration SET version = '2026.5.3';
COMMIT;