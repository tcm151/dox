-- 2023-11-17
UPDATE feedback SET
active = true
WHERE active = NONE;

-- 2023-12-03
-- add threads default value to topics
UPDATE topic SET
threads = []
WHERE threads = NONE;

-- 2023-12-03
-- add followers default value to topics
UPDATE topic SET followers = <future> {
    LET $id = id;
    RETURN SELECT VALUE id
    FROM user
    WHERE topics CONTAINS $id;
}
WHERE followers = NONE;