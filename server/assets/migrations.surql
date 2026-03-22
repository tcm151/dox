-- ------------------------------
-- MIGRATIONS
-- ------------------------------

-- 2023-12-03: add threads default value to topics
UPDATE topic SET
    threads = []
WHERE threads = NONE;

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
UPDATE feedback SET
    promoted = NONE
WHERE promoted != NONE;

-- 2024-06-16: add traits
REMOVE FIELD IF EXISTS confirmed ON TABLE user;
REMOVE FIELD IF EXISTS verified ON TABLE user;
UPDATE user SET
    traits = array::union(traits ?? [], ["confirmed"]),
    confirmed = NONE
WHERE confirmed = true;
UPDATE user SET
    traits = array::union(traits ?? [], ["verified"]),
    verified = NONE
WHERE verified = true;

-- 2024-06-16: add roles
REMOVE FIELD IF EXISTS admin ON TABLE user;
REMOVE FIELD IF EXISTS developer ON TABLE user;
REMOVE FIELD IF EXISTS moderator ON TABLE user;
UPDATE user SET
    roles = array::union(roles ?? [], ["admin"]),
    admin = NONE
WHERE admin = true;
UPDATE user SET
    roles = array::union(roles ?? [], ["developer"]),
    developer = NONE
WHERE developer = true;
UPDATE user SET
    roles = array::union(roles ?? [], ["moderator"]),
    moderator = NONE
WHERE moderator = true;

-- 2024-06-17: change url of images
-- UPDATE image SET
--     url = string::replace(url, /\/image\/([\w\d]+)$/, "/cdn/image/$1")
-- WHERE !string::matches(url, /\/cdn\/image\/([\w\d]+)/);
UPDATE image SET
    votes.positive = [],
    votes.misleading = [],
    votes.negative = []
WHERE votes = NONE;

-- 2024-09-12: add ability to archive posts
UPDATE post SET
    archived = false
WHERE archived = NONE;

--2025-06-12: add voting app settings
UPDATE appSettings SET
    voting.showMisleading = true
WHERE voting.showMisleading = NONE;
UPDATE appSettings SET
    voting.showNegative = true
WHERE voting.showNegative = NONE;

--2025-06-17: threads should have at least 1 visit
UPDATE thread SET
    visits = 1
WHERE visits = 0;

-- 2025-06-19: add search to feed app settings
UPDATE appSettings SET
    feed.showSearch = false
WHERE feed.showSearch = NONE;

-- 2025-06-19: votes.awards and votes.saves should always be defined
UPDATE post SET
    votes.awards = []
WHERE votes.awards = NONE;
UPDATE post SET
    votes.saves = []
WHERE votes.saves = NONE;
UPDATE thread SET
    votes.awards = []
WHERE votes.awards = NONE;
UPDATE thread SET
    votes.saves = []
WHERE votes.saves = NONE;

-- 2025-06-19: add thread replies
UPDATE thread SET
    replies = []
WHERE replies = NONE;

-- 2026-03-03: allow comments to be deleted
REMOVE FIELD IF EXISTS deleted ON TABLE post;
UPDATE comment SET
    deleted = false
WHERE deleted = NONE;

-- 2026-03-04: images used in posts are not public
LET $used = (
  SELECT array::group(images) as images FROM post GROUP ALL
);
FOR $img in $used.images {
  UPDATE $img SET public = false;
};
UPDATE image SET
  public = true
WHERE public = NONE;

-- 2026-03-20 remove token from session
REMOVE FIELD IF EXISTS token
ON TABLE session;

-- 2026-03-20 remove score from votes
REMOVE FIELD IF EXISTS votes.score
ON TABLE user;
UPDATE user SET
    votes.score = NONE;
REMOVE FIELD IF EXISTS votes.score
ON TABLE topic;
UPDATE topic SET
    votes.score = NONE;
REMOVE FIELD IF EXISTS votes.score
ON TABLE post;
UPDATE post SET 
    votes.score = NONE;
REMOVE FIELD IF EXISTS votes.score
ON TABLE thread;
UPDATE thread SET
    votes.score = NONE;
REMOVE FIELD IF EXISTS votes.score
ON TABLE comment;
UPDATE comment SET
    votes.score = NONE;

-- 2026-03-21 visits should always exist
UPDATE image SET
    visits = 1
WHERE visits = NONE;
UPDATE topic SET
    visits = 1
WHERE visits = NONE;