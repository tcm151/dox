-- ------------------------------
-- MIGRATIONS
-- ------------------------------

-- 2023-12-03: add threads default value to topics
UPDATE topic SET
    threads = []
WHERE threads = NONE;

-- 2023-12-03: add followers default value to topics
UPDATE topic SET
    followers = <future> {
        LET $id = id;
        RETURN SELECT VALUE id
        FROM user
        WHERE topics CONTAINS $id;
    }
WHERE followers = NONE;

-- 2023-12-04: rename active to dismissed and reverse value
UPDATE feedback SET
    dismissed = false
WHERE dismissed = NONE;

-- 2024-06-16: renamed field to be more descriptive
REMOVE FIELD IF EXISTS dateCreated ON TABLE user;
UPDATE user SET
    dateJoined = dateCreated,
    dateCreated = NONE
WHERE dateCreated != NONE;

-- 2024-06-16: removed field
REMOVE FIELD IF EXISTS promoted ON TABLE feedback;

-- 2024-06-16: add traits
REMOVE FIELD IF EXISTS confirmed ON TABLE user;
REMOVE FIELD IF EXISTS verified ON TABLE user;
UPDATE user SET
    traits = array::union(traits ?? [], ["confirmed"]),
    confirmed = NONE
WHERE confirmed != NONE;
UPDATE user SET
    traits = array::union(traits ?? [], ["verified"]),
    verified = NONE
WHERE verified != NONE;

-- 2024-06-16: add roles
REMOVE FIELD IF EXISTS admin ON TABLE user;
REMOVE FIELD IF EXISTS developer ON TABLE user;
REMOVE FIELD IF EXISTS moderator ON TABLE user;
UPDATE user SET
    roles = array::union(roles ?? [], ["admin"]),
    admin = NONE
WHERE admin != NONE;
UPDATE user SET
    roles = array::union(roles ?? [], ["developer"]),
    developer = NONE
WHERE developer != NONE;
UPDATE user SET
    roles = array::union(roles ?? [], ["moderator"]),
    moderator = NONE
WHERE moderator != NONE;