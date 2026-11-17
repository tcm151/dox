BEGIN TRANSACTION;

DEFINE FIELD OVERWRITE votes.awards ON comment
	TYPE array<record<user>> DEFAULT ALWAYS [];
UPDATE comment SET votes.awards = [] WHERE votes.awards IS NONE;

-- Add the Link table to existing databases so links can use the shared content model.
DEFINE TABLE IF NOT EXISTS link SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS user ON link
    TYPE record<user>;
DEFINE FIELD OVERWRITE title ON link
    TYPE string ASSERT $value.len() >= 4 AND $value.len() <= 128;
DEFINE INDEX IF NOT EXISTS linkTitleSearch ON TABLE link
    FIELDS title FULLTEXT ANALYZER relevanceSearch BM25 HIGHLIGHTS;
DEFINE FIELD IF NOT EXISTS url ON link
    TYPE string ASSERT $value.len() <= 2048;
DEFINE FIELD IF NOT EXISTS description ON link
    TYPE string ASSERT $value.len() <= 256 DEFAULT ALWAYS "";
DEFINE FIELD IF NOT EXISTS preview ON link
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD IF NOT EXISTS preview.title ON link
    TYPE option<string> ASSERT $value = NONE OR $value.len() <= 512;
DEFINE FIELD IF NOT EXISTS preview.description ON link
    TYPE option<string> ASSERT $value = NONE OR $value.len() <= 256;
DEFINE FIELD IF NOT EXISTS preview.canonicalUrl ON link
    TYPE option<string> ASSERT $value = NONE OR $value.len() <= 2048;
DEFINE FIELD IF NOT EXISTS preview.imageUrl ON link
    TYPE option<string> ASSERT $value = NONE OR $value.len() <= 2048;
DEFINE FIELD IF NOT EXISTS time ON link
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD IF NOT EXISTS tags ON link
    TYPE array<string> DEFAULT ALWAYS []
    ASSERT $value.all(|$tag| $tag IN ["nsfw", "spoiler"]);
DEFINE FIELD IF NOT EXISTS topics ON link
    TYPE array<record<topic>> DEFAULT ALWAYS []
    REFERENCE ON DELETE REJECT;
DEFINE FIELD IF NOT EXISTS comments ON link
    COMPUTED <~(comment FIELD context);
DEFINE FIELD IF NOT EXISTS moderation ON link COMPUTED (
    SELECT locked, slowed
    FROM ONLY moderation
    WHERE subject = $parent.id
    LIMIT 1
);
DEFINE FIELD IF NOT EXISTS status ON link
    TYPE string ASSERT $value IN ["active", "archived", "quarantined", "deleted"] DEFAULT ALWAYS "active";
DEFINE FIELD IF NOT EXISTS edited ON link
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD IF NOT EXISTS timeEdited ON link
    TYPE option<datetime>;
DEFINE FIELD IF NOT EXISTS visits ON link
    TYPE number DEFAULT ALWAYS 1;
DEFINE FIELD IF NOT EXISTS votes.positive ON link
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD IF NOT EXISTS votes.misleading ON link
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD IF NOT EXISTS votes.negative ON link
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD IF NOT EXISTS votes.awards ON link
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD IF NOT EXISTS votes.saves ON link
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD IF NOT EXISTS votes ON link
    TYPE object DEFAULT ALWAYS { positive: [], misleading: [], negative: [], awards: [], saves: [] };
DEFINE FIELD IF NOT EXISTS score ON link
    COMPUTED (votes.positive.len() - (<float>votes.misleading.len()/2) - votes.negative.len()) * visits;
DEFINE EVENT IF NOT EXISTS ensureTopics ON link WHEN $event = 'CREATE' THEN {
    FOR $topic in $after.topics {
        IF !record::exists($topic) {
            CREATE $topic;
        }
    };
};

-- Give existing galleries a stable title and links an author-editable description.
DEFINE FIELD IF NOT EXISTS title ON gallery
    TYPE string ASSERT $value.len() >= 4 AND $value.len() <= 128 DEFAULT ALWAYS "Gallery";
UPDATE gallery SET title = IF string::len(string::trim(description)) >= 4
    THEN string::slice(string::trim(description), 0, 128)
    ELSE "Gallery"
END WHERE title = NONE;
UPDATE gallery SET description = string::slice(description, 0, 256) WHERE description.len() > 256;
DEFINE FIELD OVERWRITE description ON gallery
    TYPE string ASSERT $value.len() <= 256 DEFAULT ALWAYS "";
DEFINE INDEX IF NOT EXISTS galleryTitleSearch ON TABLE gallery
    FIELDS title FULLTEXT ANALYZER relevanceSearch BM25 HIGHLIGHTS;

-- Include links in topic metadata so topic activity accounts for published links.
DEFINE FIELD IF NOT EXISTS links ON topic
    COMPUTED <~(link FIELD topics);
DEFINE FIELD OVERWRITE firstUsed ON topic
    COMPUTED time::min(array::filter(array::union(array::union(array::union(posts.time ?? [], threads.time ?? []), galleries.time ?? []), links.time ?? []), |$value| $value != NONE));

-- Let existing comment records point to links like other commentable content.
DEFINE FIELD OVERWRITE context ON comment
    TYPE record<post | link | gallery> ASSERT record::exists($value)
    REFERENCE ON DELETE REJECT;
DEFINE FIELD OVERWRITE replyTo ON comment
    TYPE record<post | link | gallery | comment>;

-- Expand pinned content to include links while preserving the unique pin index.
REMOVE INDEX IF EXISTS pinItemScopeTopic ON TABLE pin;
DEFINE FIELD OVERWRITE item ON pin
    TYPE record<post|thread|gallery|link>;
DEFINE INDEX IF NOT EXISTS pinItemScopeTopic ON TABLE pin
    FIELDS item, scope, topic UNIQUE;

-- Allow notifications to retain links as their content context.
DEFINE FIELD OVERWRITE context ON notification
    TYPE record<post|link|comment|user|thread|gallery|image|report|topic>;

-- Allow moderation records to target links under the existing subject contract.
DEFINE FIELD OVERWRITE subject ON moderation
    TYPE record<post | link | gallery | comment | thread>
    ASSERT record::exists($value)
    REFERENCE ON DELETE CASCADE;

-- Include active links in the shared feed so they participate in existing feed workflows.
DEFINE TABLE OVERWRITE feed AS
SELECT id, id AS sourceId, time,
    fn::calculate_score(votes.positive, votes.misleading, votes.negative, visits) AS score,
    user, topics
FROM post, thread, gallery, link
WHERE IF id IS NONE THEN false ELSE (
    (record::tb(id) = 'post' AND status = 'active')
    OR (record::tb(id) = 'thread' AND replyTo = NONE AND status = 'active')
    OR (record::tb(id) = 'gallery' AND status = 'active')
    OR (record::tb(id) = 'link' AND status = 'active')
) END;

-- Stash settings while replacing the flexible schema, then restore only declared fields.
LET $settings = (SELECT * FROM appSettings);
DELETE appSettings;

-- Replace flexible AppSettings objects with typed parents and constrained nested fields.
DEFINE FIELD OVERWRITE about ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE about.summary ON appSettings
    TYPE string DEFAULT ALWAYS "";
DEFINE FIELD OVERWRITE email ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE email.support ON appSettings
    TYPE string DEFAULT ALWAYS "";
DEFINE FIELD OVERWRITE email.additional ON appSettings
    TYPE string DEFAULT ALWAYS "";
DEFINE FIELD OVERWRITE email.spool ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE email.spool.dailyLimit ON appSettings
    TYPE int DEFAULT ALWAYS 100 ASSERT $value >= 1 AND $value <= 100000;
DEFINE FIELD OVERWRITE email.spool.batchLimit ON appSettings
    TYPE int DEFAULT ALWAYS 10 ASSERT $value >= 1 AND $value <= 1000;
DEFINE FIELD OVERWRITE email.spool.maxRetries ON appSettings
    TYPE int DEFAULT ALWAYS 3 ASSERT $value >= 0 AND $value <= 10;
DEFINE FIELD OVERWRITE moderation ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE moderation.perTopic ON appSettings
    TYPE int DEFAULT ALWAYS 3 ASSERT $value >= 0;
DEFINE FIELD OVERWRITE moderation.threshold ON appSettings
    TYPE int DEFAULT ALWAYS 2 ASSERT $value >= 1;
DEFINE FIELD OVERWRITE moderation.slowModes ON appSettings
    TYPE array<int> DEFAULT ALWAYS [30, 60, 300, 900]
    ASSERT $value.all(|$interval| $interval > 0);
DEFINE FIELD OVERWRITE content ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE content.visibility ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE content.visibility.nsfw ON appSettings
    TYPE string DEFAULT ALWAYS "mask" ASSERT $value IN ["show", "mask", "filter"];
DEFINE FIELD OVERWRITE content.visibility.spoiler ON appSettings
    TYPE string DEFAULT ALWAYS "mask" ASSERT $value IN ["show", "mask", "filter"];
DEFINE FIELD OVERWRITE voting ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE voting.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD OVERWRITE voting.misleading ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD OVERWRITE voting.negative ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD OVERWRITE topics ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE topics.perSubmission ON appSettings
    TYPE int DEFAULT ALWAYS 3 ASSERT $value >= 0 AND $value <= 5;
DEFINE FIELD OVERWRITE topics.restrict ON appSettings
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD OVERWRITE topics.allowed ON appSettings
    TYPE array<string> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE feeds ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE feeds.search ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD OVERWRITE feeds.discover ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD OVERWRITE feeds.topics ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD OVERWRITE feeds.posts ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD OVERWRITE feeds.links ON appSettings
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD OVERWRITE feeds.threads ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD OVERWRITE feeds.images ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD OVERWRITE feeds.audio ON appSettings
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD OVERWRITE feeds.video ON appSettings
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD OVERWRITE feeds.polls ON appSettings
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD OVERWRITE posts ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE posts.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD OVERWRITE links ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE links.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD OVERWRITE threads ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE threads.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD OVERWRITE media ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE media.tokens ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE media.tokens.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD OVERWRITE media.images ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE media.images.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD OVERWRITE media.images.uploadLimit ON appSettings
    TYPE int DEFAULT ALWAYS 10 ASSERT $value >= 0 AND $value <= 100;
DEFINE FIELD OVERWRITE media.images.attachments ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE media.images.attachments.posts ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD OVERWRITE media.images.attachments.threads ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD OVERWRITE media.gallery ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE media.gallery.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD OVERWRITE media.audio ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE media.audio.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD OVERWRITE media.audio.uploadLimit ON appSettings
    TYPE int DEFAULT ALWAYS 100 ASSERT $value >= 0 AND $value <= 500;
DEFINE FIELD OVERWRITE media.video ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE media.video.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD OVERWRITE media.video.uploadLimit ON appSettings
    TYPE int DEFAULT ALWAYS 500 ASSERT $value >= 0;
DEFINE FIELD OVERWRITE polls ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE polls.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD OVERWRITE misc ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE misc.feedback ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE misc.feedback.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD OVERWRITE misc.feedback.allowAnonymous ON appSettings
    TYPE bool DEFAULT ALWAYS false;

FOR $setting IN $settings {
    CREATE ONLY $setting.id CONTENT {
        about: {
            summary: $setting.about.summary ?? "",
        },
        email: {
            support: $setting.email.support ?? "",
            additional: $setting.email.additional ?? "",
            spool: {
                dailyLimit: IF type::is_int($setting.email.spool.dailyLimit) AND $setting.email.spool.dailyLimit >= 1 AND $setting.email.spool.dailyLimit <= 100000 THEN $setting.email.spool.dailyLimit ELSE 100 END,
                batchLimit: IF type::is_int($setting.email.spool.batchLimit) AND $setting.email.spool.batchLimit >= 1 AND $setting.email.spool.batchLimit <= 1000 THEN $setting.email.spool.batchLimit ELSE 10 END,
                maxRetries: IF type::is_int($setting.email.spool.maxRetries) AND $setting.email.spool.maxRetries >= 0 AND $setting.email.spool.maxRetries <= 10 THEN $setting.email.spool.maxRetries ELSE 3 END,
            },
        },
        moderation: {
            perTopic: $setting.moderation.perTopic ?? 3,
            threshold: $setting.moderation.threshold ?? 2,
            slowModes: $setting.moderation.slowModes ?? [30, 60, 300, 900],
        },
        content: {
            visibility: {
                nsfw: IF $setting.content.visibility.nsfw IN ["show", "mask", "filter"] THEN $setting.content.visibility.nsfw ELSE "mask" END,
                spoiler: IF $setting.content.visibility.spoiler IN ["show", "mask", "filter"] THEN $setting.content.visibility.spoiler ELSE "mask" END,
            },
        },
        voting: {
            enabled: $setting.voting.enabled ?? true,
            misleading: $setting.voting.misleading ?? true,
            negative: $setting.voting.negative ?? true,
        },
        topics: {
            perSubmission: $setting.topics.perSubmission ?? 3,
            restrict: $setting.topics.restrict ?? false,
            allowed: $setting.topics.allowed ?? [],
        },
        feeds: {
            search: $setting.feeds.search ?? true,
            discover: $setting.feeds.discover ?? true,
            topics: $setting.feeds.topics ?? true,
            posts: $setting.feeds.posts ?? true,
            links: $setting.feeds.links ?? false,
            threads: $setting.feeds.threads ?? true,
            images: $setting.feeds.images ?? true,
            audio: $setting.feeds.audio ?? false,
            video: $setting.feeds.video ?? false,
            polls: $setting.feeds.polls ?? false,
        },
        posts: {
            enabled: $setting.posts.enabled ?? true,
        },
        links: {
            enabled: $setting.links.enabled ?? false,
        },
        threads: {
            enabled: $setting.threads.enabled ?? true,
        },
        media: {
            tokens: {
                enabled: $setting.media.tokens.enabled ?? false,
            },
            images: {
                enabled: $setting.media.images.enabled ?? true,
                uploadLimit: $setting.media.images.uploadLimit ?? 10,
                attachments: {
                    posts: IF type::is_bool($setting.media.images.attachments.posts)
                        THEN $setting.media.images.attachments.posts
                        ELSE true
                    END,
                    threads: IF type::is_bool($setting.media.images.attachments.threads)
                        THEN $setting.media.images.attachments.threads
                        ELSE true
                    END,
                },
            },
            gallery: {
                enabled: IF type::is_bool($setting.media.gallery.enabled)
                    THEN $setting.media.gallery.enabled
                    ELSE true
                END,
            },
            audio: {
                enabled: $setting.media.audio.enabled ?? false,
                uploadLimit: $setting.media.audio.uploadLimit ?? 100,
            },
            video: {
                enabled: $setting.media.video.enabled ?? false,
                uploadLimit: $setting.media.video.uploadLimit ?? 500,
            },
        },
        polls: {
            enabled: $setting.polls.enabled ?? false,
        },
        misc: {
            feedback: {
                enabled: $setting.misc.feedback.enabled ?? true,
                allowAnonymous: $setting.misc.feedback.allowAnonymous ?? false,
            },
        },
    };
};

IF !record::exists(appSettings:default) {
    CREATE appSettings:default;
};

-- Add user and topic content filters to existing user settings.
DEFINE FIELD IF NOT EXISTS content.filters ON userSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD IF NOT EXISTS content.filters.muted ON userSettings
    TYPE array<record<user | topic>> DEFAULT ALWAYS [];
DEFINE FIELD IF NOT EXISTS content.filters.blocked ON userSettings
    TYPE array<record<user | topic>> DEFAULT ALWAYS [];
UPDATE userSettings SET
    content.filters.muted = content.filters.muted ?? [],
    content.filters.blocked = content.filters.blocked ?? [];

-- Give existing user settings a public profile audience by default.
DEFINE FIELD IF NOT EXISTS privacy ON userSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD IF NOT EXISTS privacy.profile ON userSettings
    TYPE string DEFAULT ALWAYS "public" ASSERT $value IN ["public", "members", "private"];
UPDATE userSettings SET privacy.profile = "public" WHERE privacy.profile = NONE;

-- Centralize profile-audience checks for user-facing queries.
DEFINE FUNCTION OVERWRITE fn::can_view_profile(
    $visibility: string,
    $viewer: option<record<user>>,
    $owner: record<user>
) -> bool {
    RETURN $visibility = "public"
        OR ($visibility = "members" AND $viewer != NONE)
        OR ($visibility = "private" AND $viewer = $owner);
};

-- Project thread authors explicitly in recursive ancestor and reply-chain results.
DEFINE FUNCTION OVERWRITE fn::thread_ancestors($threadId: record<thread>, $remaining: int) -> array<object> {
    IF $remaining <= 0 {
        LET $parent = (SELECT VALUE replyTo FROM ONLY $threadId);
        RETURN IF $parent != NONE { [{ id: "thread:load_more" }] } ELSE { [] };
    };
    LET $thread = SELECT id, replyTo FROM ONLY $threadId;
    IF $thread.replyTo = NONE {
        RETURN [];
    };
    LET $parent = (
        SELECT id, user.{id, name, roles}, content, tags, time, edited, timeEdited, visits, votes, score, status, deleted, moderation, replies
        FROM ONLY $thread.replyTo
    );
    LET $ancestors = fn::thread_ancestors($thread.replyTo, $remaining - 1);
    RETURN $ancestors.concat([$parent]);
};

DEFINE FUNCTION OVERWRITE fn::thread_chain($parent: record<thread>, $remaining: int) -> array<object> {
    LET $nextId = (
        SELECT VALUE id FROM ONLY thread
        WHERE replyTo = $parent
        ORDER BY score DESC, id ASC LIMIT 1
    );
    IF $nextId = NONE {
        RETURN [];
    };
    IF $remaining <= 0 {
        RETURN [{ id: "thread:load_more" }];
    };
    LET $next = (
        SELECT id, user.{id, name, roles}, content, tags, time, edited, timeEdited, visits, votes, score, status, deleted, replyTo, moderation, replies
        FROM ONLY $nextId
    );
    LET $tail = fn::thread_chain($nextId, $remaining - 1);
    RETURN [$next].concat($tail);
};

-- Allow anonymous feedback while preserving existing submitter references.
DEFINE FIELD OVERWRITE user ON feedback
    TYPE option<record<user>>;

-- Restrict persisted media extensions to formats already produced by either upload route.
DEFINE FIELD OVERWRITE type ON image
    TYPE string ASSERT $value IN ["gif", "webp", "png", "jpeg", "mp3"];
DEFINE FIELD OVERWRITE type ON audio
    TYPE string ASSERT $value IN ["gif", "webp", "png", "jpeg", "mp3"];

-- Preserve legacy cross-category files and persist cleanup retry diagnostics.
DEFINE FIELD OVERWRITE type ON mediaTrash
    TYPE string ASSERT $value IN ["image", "audio"];
DEFINE FIELD OVERWRITE extension ON mediaTrash
    TYPE string ASSERT $value IN ["gif", "webp", "png", "jpeg", "mp3"];
DEFINE FIELD IF NOT EXISTS attempts ON mediaTrash
    TYPE int DEFAULT ALWAYS 0 ASSERT $value >= 0;
DEFINE FIELD IF NOT EXISTS retryAfter ON mediaTrash
    TYPE option<datetime>;
DEFINE FIELD IF NOT EXISTS lastError ON mediaTrash
    TYPE option<string> ASSERT $value = NONE OR $value.len() <= 1024;
UPDATE mediaTrash SET attempts = 0 WHERE attempts = NONE;

UPSERT migration SET version = '2026.6.3', time = time::now()
WHERE version = '2026.6.3';
COMMIT;