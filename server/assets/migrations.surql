-- 2023-12-03: add threads default value to topics
UPDATE topic SET
threads = []
WHERE threads = NONE;

-- 2023-12-03: add followers default value to topics
UPDATE topic SET followers = <future> {
    LET $id = id;
    RETURN SELECT VALUE id
    FROM user
    WHERE topics CONTAINS $id;
}
WHERE followers = NONE;

-- 2023-12-04: add promoted default value on feedback
UPDATE feedback SET promoted = false
WHERE promoted = NONE;

-- 2023-12-04: rename active to dismissed and reverse value
UPDATE feedback SET dismissed = false
WHERE dismissed = NONE;