-- 2023-11-17
UPDATE feedback SET
active = true
WHERE active = NONE;

-- 2023-12-03
UPDATE topic SET
threads = []
WHERE threads = NONE;