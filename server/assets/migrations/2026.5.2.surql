BEGIN TRANSACTION;

DEFINE TABLE OVERWRITE migration SCHEMAFULL;
DEFINE FIELD OVERWRITE version ON migration
    TYPE string;
DEFINE FIELD OVERWRITE time ON migration
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE INDEX OVERWRITE version ON migration
    FIELDS version UNIQUE;

CREATE ONLY migration SET version = '2026.5.2';
COMMIT;