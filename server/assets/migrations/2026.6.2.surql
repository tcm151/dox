BEGIN TRANSACTION;

LET $replies = (SELECT id, replyTo FROM thread WHERE replyTo != NONE AND record::exists(replyTo));
LET $quotes = (SELECT id, quote FROM thread WHERE quote != NONE AND record::exists(quote));
LET $postTopics = (SELECT id, topics FROM post WHERE deleted = false);
LET $threadTopics = (SELECT id, topics FROM thread WHERE deleted = false);
LET $galleryTopics = (SELECT id, topics FROM gallery);

UPDATE thread SET replyTo = NONE WHERE replyTo != NONE AND !record::exists(replyTo);
UPDATE thread SET quote = NONE WHERE quote != NONE AND !record::exists(quote);

REMOVE EVENT IF EXISTS updateReplyTo ON thread;
REMOVE EVENT IF EXISTS updatePost ON comment;
REMOVE EVENT IF EXISTS removeBlank ON topic;
REMOVE EVENT IF EXISTS updateTopics ON post;
REMOVE EVENT IF EXISTS updateTopics ON thread;
REMOVE EVENT IF EXISTS updateTopics ON gallery;

DEFINE FIELD OVERWRITE replyTo ON thread
    TYPE option<record<thread>> ASSERT $value = NONE OR record::exists($value)
    REFERENCE ON DELETE REJECT;
DEFINE FIELD OVERWRITE quote ON thread
    TYPE option<record<thread>> ASSERT $value = NONE OR record::exists($value)
    REFERENCE ON DELETE UNSET;

UPDATE thread SET replyTo = NONE WHERE replyTo != NONE;
UPDATE thread SET quote = NONE WHERE quote != NONE;
FOR $relation IN $replies {
    UPDATE $relation.id SET replyTo = $relation.replyTo;
};
FOR $relation IN $quotes {
    UPDATE $relation.id SET quote = $relation.quote;
};

DEFINE FIELD OVERWRITE posts ON topic
    TYPE option<array<record<post>>>;
DEFINE FIELD OVERWRITE threads ON topic
    TYPE option<array<record<thread>>>;
DEFINE FIELD OVERWRITE galleries ON topic
    TYPE option<array<record<gallery>>>;
UPDATE topic UNSET posts, threads, galleries;
REMOVE FIELD posts.* ON topic;
REMOVE FIELD threads.* ON topic;
REMOVE FIELD galleries.* ON topic;
REMOVE FIELD posts ON topic;
REMOVE FIELD threads ON topic;
REMOVE FIELD galleries ON topic;

DEFINE FIELD OVERWRITE topics ON post
    TYPE option<array<record<topic>>>;
UPDATE post UNSET topics;
REMOVE FIELD topics.* ON post;
REMOVE FIELD topics ON post;
DEFINE FIELD topics ON post
    TYPE array<record<topic>> DEFAULT ALWAYS [] REFERENCE ON DELETE REJECT;

DEFINE FIELD OVERWRITE topics ON thread
    TYPE option<array<record<topic>>>;
UPDATE thread UNSET topics;
REMOVE FIELD topics.* ON thread;
REMOVE FIELD topics ON thread;
DEFINE FIELD topics ON thread
    TYPE array<record<topic>> DEFAULT ALWAYS [] REFERENCE ON DELETE REJECT;

DEFINE FIELD OVERWRITE topics ON gallery
    TYPE option<array<record<topic>>>;
UPDATE gallery UNSET topics;
REMOVE FIELD topics.* ON gallery;
REMOVE FIELD topics ON gallery;
DEFINE FIELD topics ON gallery
    TYPE array<record<topic>> DEFAULT ALWAYS [] REFERENCE ON DELETE REJECT;

UPDATE post SET topics = [];
UPDATE thread SET topics = [];
UPDATE gallery SET topics = [];

FOR $post IN $postTopics {
    FOR $topic IN $post.topics {
        IF !record::exists($topic) {
            CREATE $topic;
        };
        UPDATE $post.id SET topics += $topic;
    };
};
FOR $thread IN $threadTopics {
    FOR $topic IN $thread.topics {
        IF !record::exists($topic) {
            CREATE $topic;
        };
        UPDATE $thread.id SET topics += $topic;
    };
};
FOR $gallery IN $galleryTopics {
    FOR $topic IN $gallery.topics {
        IF !record::exists($topic) {
            CREATE $topic;
        };
        UPDATE $gallery.id SET topics += $topic;
    };
};

DEFINE FIELD posts ON topic
    COMPUTED <~(post FIELD topics);
DEFINE FIELD threads ON topic
    COMPUTED <~(thread FIELD topics);
DEFINE FIELD galleries ON topic
    COMPUTED <~(gallery FIELD topics);

LET $emptyTopics = SELECT VALUE id FROM topic
    WHERE posts.len() = 0 AND threads.len() = 0 AND galleries.len() = 0;
FOR $topic IN $emptyTopics {
    DELETE $topic;
};

DEFINE EVENT OVERWRITE ensureTopics ON post WHEN $event = 'CREATE' THEN {
    FOR $topic IN $after.topics {
        IF !record::exists($topic) {
            CREATE $topic;
        };
    };
};
DEFINE EVENT OVERWRITE ensureTopics ON thread WHEN $event = 'CREATE' THEN {
    FOR $topic IN $after.topics {
        IF !record::exists($topic) {
            CREATE $topic;
        };
    };
};
DEFINE EVENT OVERWRITE ensureTopics ON gallery WHEN $event = 'CREATE' THEN {
    FOR $topic IN $after.topics {
        IF !record::exists($topic) {
            CREATE $topic;
        };
    };
};

DEFINE FIELD OVERWRITE replies ON thread
    TYPE option<array<record<thread>>>;
DEFINE FIELD OVERWRITE quotes ON thread
    TYPE option<array<record<thread>>>;
UPDATE thread UNSET replies, quotes;
REMOVE FIELD replies.* ON thread;
REMOVE FIELD quotes.* ON thread;
REMOVE FIELD replies ON thread;
REMOVE FIELD quotes ON thread;

DEFINE FIELD OVERWRITE comments ON post
    TYPE option<array<record<comment>>>;
UPDATE post UNSET comments;
REMOVE FIELD comments.* ON post;
REMOVE FIELD comments ON post;
COMMIT;

BEGIN TRANSACTION;
UPDATE comment UNSET comments;
DEFINE FIELD OVERWRITE post ON comment
    TYPE option<record<post>>
    ASSERT $value = NONE OR record::exists($value)
    REFERENCE ON DELETE REJECT;
DEFINE FIELD OVERWRITE gallery ON comment
    TYPE option<record<gallery>> ASSERT $value = NONE OR record::exists($value)
    REFERENCE ON DELETE REJECT;
LET $commentTargets = (SELECT id, post, gallery FROM comment WHERE post != NONE OR gallery != NONE);
DEFINE FIELD OVERWRITE context ON comment
    TYPE option<record<post | gallery>> ASSERT $value = NONE OR record::exists($value)
    REFERENCE ON DELETE REJECT;
UPDATE comment UNSET post, gallery;
FOR $target IN $commentTargets {
    UPDATE $target.id SET context = $target.post ?? $target.gallery;
};
REMOVE FIELD post ON comment;
REMOVE FIELD gallery ON comment;
DEFINE FIELD OVERWRITE context ON comment
    TYPE record<post | gallery> ASSERT record::exists($value)
    REFERENCE ON DELETE REJECT;
DEFINE FIELD OVERWRITE replyTo ON comment
    TYPE record<post | gallery | comment>;
DEFINE FIELD IF NOT EXISTS status ON comment
    TYPE string ASSERT $value IN ["active", "archived", "quarantined", "deleted"] DEFAULT ALWAYS "active";
UPDATE comment SET status = "active" WHERE status = NONE;
DEFINE FIELD OVERWRITE comments ON post
    COMPUTED <~(comment FIELD context);
DEFINE FIELD OVERWRITE comments ON gallery
    COMPUTED <~(comment FIELD context);

DEFINE FIELD replies ON thread
    COMPUTED <~(thread FIELD replyTo);
DEFINE FIELD quotes ON thread
    COMPUTED <~(thread FIELD quote);

DEFINE FIELD OVERWRITE visits ON user
    TYPE number DEFAULT ALWAYS 1;
DEFINE FIELD OVERWRITE visits ON post
    TYPE number DEFAULT ALWAYS 1;
DEFINE FIELD OVERWRITE visits ON thread
    TYPE number DEFAULT ALWAYS 1;
DEFINE FIELD OVERWRITE visits ON gallery
    TYPE number DEFAULT ALWAYS 1;
DEFINE FIELD OVERWRITE visits ON image
    TYPE number DEFAULT ALWAYS 1;

DEFINE FIELD OVERWRITE topics ON report
    COMPUTED array::union(subject.topics ?? [], subject.context.topics ?? []);

DEFINE TABLE IF NOT EXISTS moderation SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS subject ON moderation
    TYPE record<post | gallery | comment | thread>
    ASSERT record::exists($value)
    REFERENCE ON DELETE CASCADE;
DEFINE INDEX IF NOT EXISTS subject ON TABLE moderation
    FIELDS subject UNIQUE;
DEFINE FIELD IF NOT EXISTS locked ON moderation
    TYPE option<string> ASSERT $value = NONE OR $value IN ["item", "chain"];
DEFINE FIELD IF NOT EXISTS slowed ON moderation
    TYPE option<int> ASSERT $value = NONE OR $value > 0;

DEFINE FIELD IF NOT EXISTS moderation ON post COMPUTED (
    SELECT locked, slowed
    FROM ONLY moderation
    WHERE subject = $parent.id
    LIMIT 1
);
DEFINE FIELD IF NOT EXISTS moderation ON gallery COMPUTED (
    SELECT locked, slowed
    FROM ONLY moderation
    WHERE subject = $parent.id
    LIMIT 1
);
DEFINE FIELD IF NOT EXISTS moderation ON comment COMPUTED (
    SELECT locked, slowed
    FROM ONLY moderation
    WHERE subject = $parent.id
    LIMIT 1
);

DEFINE FUNCTION OVERWRITE fn::thread_ancestors($threadId: record<thread>, $visited: array<record<thread>>, $remaining: int) -> array<record<thread>> {
    IF $remaining <= 0 {
        fn::http(409, "Thread reply chain exceeds the supported depth.");
    };
    IF $threadId IN $visited {
        fn::http(500, "Invalid thread reply chain: cycle detected.");
    };
    LET $thread = SELECT * FROM ONLY $threadId;
    IF $thread = NONE {
        IF $visited.len() = 0 {
            fn::http(404, "Thread not found.");
        };
        fn::http(500, "Invalid thread reply chain: ancestor not found.");
    };
    IF $thread.replyTo = NONE {
        RETURN [];
    };
    LET $ancestors = fn::thread_ancestors($thread.replyTo, $visited.concat([$threadId]), $remaining - 1);
    RETURN [$thread.replyTo].concat($ancestors);
};

DEFINE FUNCTION OVERWRITE fn::thread_chain($parent: record<thread>, $remaining: int) -> object {
    IF $remaining <= 0 {
        LET $next = (
            SELECT VALUE id FROM ONLY thread
            WHERE replyTo = $parent
            ORDER BY score DESC LIMIT 1
        );
        RETURN { items: [], more: $next != NONE };
    };
    LET $next = (
        SELECT * FROM ONLY thread
        WHERE replyTo = $parent
        ORDER BY score DESC LIMIT 1
        FETCH user
    );
    IF $next = NONE {
        RETURN { items: [], more: false };
    };
    LET $tail = fn::thread_chain($next.id, $remaining - 1);
    RETURN { items: [$next].concat($tail.items), more: $tail.more };
};

UPDATE appSettings:default SET
    moderation.slowModes = [30, 60, 300, 900]
WHERE moderation.slowModes = NONE;

UPSERT migration SET version = '2026.6.2', time = time::now()
WHERE version = '2026.6.2';
COMMIT;