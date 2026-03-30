-- ------------------------------
-- MIGRATIONS
-- ------------------------------

-- 2026-03-26
UPDATE user, post, thread, user, topic SET
  visits = 0
WHERE visits = NONE;

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
UPDATE image SET
    votes.positive = [],
    votes.misleading = [],
    votes.negative = []
WHERE votes = NONE;

-- 2024-09-12: add ability to archive posts
UPDATE post SET
    archived = false
WHERE archived = NONE;

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
REMOVE FIELD IF EXISTS votes.score
ON TABLE topic;
REMOVE FIELD IF EXISTS votes.score
ON TABLE post;
REMOVE FIELD IF EXISTS votes.score
ON TABLE thread;
REMOVE FIELD IF EXISTS votes.score
ON TABLE comment;
UPDATE user, topic, post, thread, comment SET
    votes.score = NONE
WHERE votes.score != NONE;

-- 2026-03-22
REMOVE FIELD IF EXISTS token
ON TABLE session;
UPDATE session SET
    token = NONE
WHERE token != NONE;

-- 2026-03-25
REMOVE FIELD IF EXISTS post
ON TABLE pin;
UPDATE pin SET
    item = post,
    post = NONE
WHERE item = NONE;

--2026-03-26
UPDATE image SET
    name = ""
WHERE name = NONE;

-- 2026-03-28 major settings migration
UPDATE appSettings:default SET
    email.support = email.support,
    email.additional = "",
    voting.enabled = true,
    voting.misleading = voting.showMisleading,
    voting.negative = voting.showNegative,
    voting.showMisleading = NONE,
    voting.showNegative = NONE,
    topics.enabled = true,
    topics.perSubmission = 3,
    topics.restrictTopics = false,
    topics.allowList = [],
    feeds.search = feed.showSearch,
    feeds.discover = true,
    feeds.topics = feed.showTopics,
    feeds.posts = true,
    feeds.threads = feed.showThreads,
    feeds.images = feed.showImages,
    feeds.audio = false,
    feeds.video = false,
    feed = NONE,
    posts.enabled = true,
    threads.enabled = true,
    media.tokens.enabled = navbar.showStore,
    media.images.enabled = media.uploads.enabled,
    media.images.uploadLimit = media.uploads.imageMaxSize,
    media.audio.enabled = false,
    media.audio.uploadLimit = media.uploads.audioMaxSize,
    media.video.enabled = false,
    media.video.uploadLimit = 500,
    media.uploads = NONE,
    misc.feedback.enabled = navbar.showFeedback,
    misc.feedback.allowAnonymous = false,
    navbar = NONE
WHERE email.additional = NONE;

-- 2026-03-29 cleanup schema and remove unused stuff
REMOVE ACCESS IF EXISTS account ON DATABASE;
REMOVE FUNCTION IF EXISTS fn::days_since;

-- 2026-03-30 major account migration
UPDATE session SET
    account = (SELECT VALUE id FROM account WHERE user.id = $parent.user)[0]
WHERE account = NONE AND user != NONE;

FOR $user IN (SELECT id, email, password FROM user) {
    IF array::len(SELECT user FROM account WHERE user = $user.id) = 0 {
        CREATE account SET
            user = $user.id,
            email = $user.email,
            password = $user.password;
    };
};

REMOVE FIELD IF EXISTS email ON TABLE user;
REMOVE FIELD IF EXISTS password ON TABLE user;
UPDATE user SET email = NONE, password = NONE
WHERE email != NONE OR password != NONE;

REMOVE FIELD IF EXISTS user ON TABLE session;
UPDATE session SET user = NONE WHERE user != NONE;