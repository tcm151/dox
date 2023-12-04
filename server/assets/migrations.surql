-- 2023-11-17: add active default value to feedback
UPDATE feedback SET
active = true
WHERE active = NONE;

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
UPDATE feedback SET dismissed = !active
WHERE active != NONE AND dismissed = NONE;

-- 2023-12-04: remove active field
REMOVE FIELD active ON feedback;
UPDATE feedback SET active = NONE
WHERE active != NONE;