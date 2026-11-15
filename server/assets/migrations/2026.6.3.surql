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

UPSERT migration SET version = '2026.6.3', time = time::now()
WHERE version = '2026.6.3';
COMMIT;