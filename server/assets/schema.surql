-- ------------------------------
-- TABLE: migrations
-- ------------------------------
DEFINE TABLE migration SCHEMAFULL;
DEFINE FIELD version ON migration
    TYPE string;
DEFINE FIELD time ON migration
    TYPE datetime DEFAULT ALWAYS time::now();

DEFINE INDEX version ON migration
    FIELDS version UNIQUE;

CREATE ONLY migration SET version = $version;


-- ------------------------------
-- FUNCTIONS
-- ------------------------------
DEFINE FUNCTION fn::sort_hot($score: number, $created_at: datetime, $as_of: datetime) -> number {
    LET $age_hours = math::max([1, (time::unix($as_of) - time::unix($created_at)) / 3600]);
    RETURN <float>$score / math::pow($age_hours, 2);
};
DEFINE FUNCTION fn::calculate_score(
    $positive: array<record<user>>,
    $misleading: array<record<user>>,
    $negative: array<record<user>>,
    $visits: number
) -> number {
    RETURN ($positive.len() - (<float>$misleading.len()/2) - $negative.len()) * $visits;
};
DEFINE FUNCTION fn::http($status: int, $message: string) {
    THROW string::concat("APP_ERROR:", <string>$status, ":", $message);
};
DEFINE FUNCTION fn::can_view_profile($owner: record<user>, $viewer: option<record<user>>) -> bool {
    LET $visibility = (
        SELECT VALUE privacy.profile
        FROM ONLY userSettings
        WHERE user = $owner
    );
    RETURN $visibility = "public"
    OR ($visibility = "members" AND $viewer != NONE)
    OR ($visibility = "private" AND $viewer = $owner)
    OR ($viewer != NONE AND $viewer.roles CONTAINS "admin");
};

DEFINE ANALYZER IF NOT EXISTS relevanceSearch
    TOKENIZERS camel, class
    FILTERS lowercase, ascii, snowball(english);


-- ------------------------------
-- TABLE: account
-- ------------------------------
DEFINE TABLE account SCHEMAFULL;
DEFINE FIELD email ON account
    TYPE string ASSERT string::is_email($value);
DEFINE FIELD password ON account
    TYPE string;
DEFINE FIELD user ON account
    TYPE record<user>;

DEFINE INDEX email ON account
    FIELDS email UNIQUE;
DEFINE INDEX user ON account
    FIELDS user UNIQUE;


-- ------------------------------
-- TABLE: user
-- ------------------------------
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD name ON user
    TYPE string ASSERT $value = /^[\w]{3,32}$/;
DEFINE FIELD link ON user
    TYPE option<string>;
DEFINE FIELD description on user
    TYPE option<string>;
DEFINE FIELD dateJoined ON user
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD topics ON user
    TYPE array<record<topic>> DEFAULT ALWAYS [];
-- TODO use <~(user FIELD following) to automatically update followers
DEFINE FIELD followers ON user
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD following ON user
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD tokens ON user
    TYPE int DEFAULT ALWAYS 5000 ASSERT $value >= 0 AND $value <= 65536;
DEFINE FIELD roles ON user
    TYPE array<string> DEFAULT ALWAYS [];
DEFINE FIELD traits ON user
    TYPE array<string> DEFAULT ALWAYS [];
DEFINE FIELD visits ON user
    TYPE number DEFAULT ALWAYS 1;
DEFINE FIELD votes ON user
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD votes.positive ON user
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.misleading ON user
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.negative ON user
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.awards ON user
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.saves ON user
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD score ON user
    COMPUTED fn::calculate_score(votes.positive, votes.misleading, votes.negative, visits);

DEFINE INDEX name ON user
    FIELDS name UNIQUE;


-- ------------------------------
-- TABLE: session
-- ------------------------------
DEFINE TABLE session SCHEMAFULL;
DEFINE FIELD account ON session
    TYPE record<account>;
DEFINE FIELD time ON session
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD invalidated ON session
    TYPE bool DEFAULT ALWAYS false;


-- ------------------------------
-- TABLE: topic
-- ------------------------------
DEFINE TABLE topic SCHEMAFULL;
DEFINE FIELD description ON topic
    TYPE option<string>;
DEFINE FIELD rules ON topic
    TYPE option<string>;
DEFINE FIELD status ON topic
    TYPE string ASSERT $value IN ["active", "locked"] DEFAULT ALWAYS "active";
DEFINE FIELD moderation ON topic
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD moderation.maxPostInterval ON topic
    TYPE number DEFAULT ALWAYS 60 ASSERT $value >= 0 AND $value <= 3600;
DEFINE FIELD moderation.priorityReportThreshold ON topic
    TYPE number DEFAULT ALWAYS 5 ASSERT $value >= 1 AND $value <= 100;
DEFINE FIELD posts ON topic
    COMPUTED <~(post FIELD topics);
DEFINE FIELD threads ON topic
    COMPUTED <~(thread FIELD topics);
DEFINE FIELD galleries ON topic
    COMPUTED <~(gallery FIELD topics);
DEFINE FIELD links ON topic
    COMPUTED <~(link FIELD topics);
DEFINE FIELD visits ON topic
    TYPE number DEFAULT ALWAYS 1;
DEFINE FIELD followers ON topic
    COMPUTED SELECT VALUE id FROM user WHERE topics CONTAINS $parent.id;
DEFINE FIELD moderators ON topic
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD firstUsed ON topic
    COMPUTED time::min(array::filter(array::union(array::union(array::union(posts.time ?? [], threads.time ?? []), galleries.time ?? []), links.time ?? []), |$value| $value != NONE));
DEFINE FIELD votes.positive ON topic
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.misleading ON topic
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.negative ON topic
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD score ON topic
    COMPUTED fn::calculate_score(votes.positive, votes.misleading, votes.negative, visits);


-- ------------------------------
-- TABLE: post
-- ------------------------------
DEFINE TABLE post SCHEMAFULL;
DEFINE FIELD user ON post
    TYPE record<user>;
DEFINE FIELD title ON post
    TYPE string ASSERT $value = /.{4,128}/;
DEFINE FIELD content ON post
    TYPE string;
DEFINE FIELD tags ON post
    TYPE array<string> DEFAULT ALWAYS []
    ASSERT $value.all(|$tag| $tag IN ["nsfw", "spoiler"]);
DEFINE FIELD time ON post
    TYPE datetime DEFAULT ALWAYS time::now();
-- TODO allow replyTo for link or gallery
DEFINE FIELD replyTo ON post
    TYPE option<record<post>>;
DEFINE FIELD topics ON post
    TYPE array<record<topic>> DEFAULT ALWAYS []
    REFERENCE ON DELETE REJECT;
DEFINE FIELD comments ON post
    COMPUTED <~(comment FIELD context);
DEFINE FIELD moderation ON post COMPUTED (
    SELECT locked, slowed
    FROM ONLY moderation
    WHERE subject = $parent.id
    LIMIT 1
);
DEFINE FIELD images ON post
    TYPE array<record<image>> DEFAULT ALWAYS [];
DEFINE FIELD status ON post
    TYPE string ASSERT $value IN ["active", "archived", "quarantined", "deleted"] DEFAULT ALWAYS "active";
DEFINE FIELD deleted ON post
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD edited ON post
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD timeEdited ON post
    TYPE option<datetime>;
DEFINE FIELD visits ON post
    TYPE number DEFAULT ALWAYS 1;
DEFINE FIELD votes ON post
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD votes.positive ON post
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.misleading ON post
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.negative ON post
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.awards ON post
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.saves ON post
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD score ON post
    COMPUTED (votes.positive.len() - (<float>votes.misleading.len()/2) - votes.negative.len()) * visits;

DEFINE INDEX IF NOT EXISTS postTitleSearch ON TABLE post
    FIELDS title FULLTEXT ANALYZER relevanceSearch BM25 HIGHLIGHTS;
DEFINE INDEX IF NOT EXISTS postContentSearch ON TABLE post
    FIELDS content FULLTEXT ANALYZER relevanceSearch BM25 HIGHLIGHTS;

DEFINE EVENT ensureTopics ON post WHEN $event = 'CREATE' THEN {
    FOR $topic in $after.topics {
        IF !record::exists($topic) {
            CREATE $topic;
        }
    };
};

-- ------------------------------
-- TABLE: link
-- ------------------------------
DEFINE TABLE link SCHEMAFULL;
DEFINE FIELD user ON link
    TYPE record<user>;
DEFINE FIELD title ON link
    TYPE string ASSERT $value.len() >= 4 AND $value.len() <= 128;
DEFINE FIELD url ON link
    TYPE string ASSERT $value.len() <= 2048;
DEFINE FIELD description ON link
    TYPE string ASSERT $value.len() <= 256 DEFAULT ALWAYS "";
DEFINE FIELD preview ON link
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD preview.title ON link
    TYPE option<string> ASSERT $value = NONE OR $value.len() <= 512;
DEFINE FIELD preview.description ON link
    TYPE option<string> ASSERT $value = NONE OR $value.len() <= 256;
DEFINE FIELD preview.canonicalUrl ON link
    TYPE option<string> ASSERT $value = NONE OR $value.len() <= 2048;
DEFINE FIELD preview.imageUrl ON link
    TYPE option<string> ASSERT $value = NONE OR $value.len() <= 2048;
DEFINE FIELD time ON link
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD tags ON link
    TYPE array<string> DEFAULT ALWAYS []
    ASSERT $value.all(|$tag| $tag IN ["nsfw", "spoiler"]);
DEFINE FIELD topics ON link
    TYPE array<record<topic>> DEFAULT ALWAYS []
    REFERENCE ON DELETE REJECT;
DEFINE FIELD comments ON link
    COMPUTED <~(comment FIELD context);
DEFINE FIELD moderation ON link COMPUTED (
    SELECT locked, slowed
    FROM ONLY moderation
    WHERE subject = $parent.id
    LIMIT 1
);
DEFINE FIELD status ON link
    TYPE string ASSERT $value IN ["active", "archived", "quarantined", "deleted"] DEFAULT ALWAYS "active";
DEFINE FIELD edited ON link
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD timeEdited ON link
    TYPE option<datetime>;
DEFINE FIELD visits ON link
    TYPE number DEFAULT ALWAYS 1;
DEFINE FIELD votes ON link
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD votes.positive ON link
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.misleading ON link
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.negative ON link
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.awards ON link
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.saves ON link
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD score ON link
    COMPUTED (votes.positive.len() - (<float>votes.misleading.len()/2) - votes.negative.len()) * visits;

DEFINE INDEX IF NOT EXISTS linkTitleSearch ON TABLE link
    FIELDS title FULLTEXT ANALYZER relevanceSearch BM25 HIGHLIGHTS;
DEFINE INDEX IF NOT EXISTS linkDescriptionSearch ON TABLE link
    FIELDS description FULLTEXT ANALYZER relevanceSearch BM25 HIGHLIGHTS;

DEFINE EVENT ensureTopics ON link WHEN $event = 'CREATE' THEN {
    FOR $topic in $after.topics {
        IF !record::exists($topic) {
            CREATE $topic;
        }
    };
};


-- ------------------------------
-- TABLE: draft
-- ------------------------------
DEFINE TABLE draft SCHEMAFULL;
DEFINE FIELD user ON draft
    TYPE record<user>;
DEFINE FIELD title ON draft
    TYPE string ASSERT $value = /.{4,128}/;
DEFINE FIELD content ON draft
    TYPE string;
DEFINE FIELD tags ON draft
    TYPE array<string> DEFAULT ALWAYS []
    ASSERT $value.all(|$tag| $tag IN ["nsfw", "spoiler"]);
DEFINE FIELD time ON draft
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD replyTo ON draft
    TYPE option<record<post>>;
DEFINE FIELD topics ON draft
    TYPE array<record<topic>> DEFAULT ALWAYS [];
DEFINE FIELD images ON draft
    TYPE array<record<image>> DEFAULT ALWAYS [];


-- ------------------------------
-- TABLE: comment
-- ------------------------------
DEFINE TABLE comment SCHEMAFULL;
DEFINE FIELD user ON comment
    TYPE record<user>;
DEFINE FIELD context ON comment
    TYPE record<post | link | gallery> ASSERT record::exists($value)
    REFERENCE ON DELETE REJECT;
DEFINE FIELD content ON comment
    TYPE string;
DEFINE FIELD time ON comment
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD replyTo ON comment
    TYPE record<post | link | gallery | comment>;
DEFINE FIELD deleted ON comment
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD status ON comment
    TYPE string ASSERT $value IN ["active", "archived", "quarantined", "deleted"] DEFAULT ALWAYS "active";
DEFINE FIELD edited ON comment
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD timeEdited ON comment
    TYPE option<datetime>;
DEFINE FIELD votes.positive ON comment
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.misleading ON comment
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.negative ON comment
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.awards ON comment
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD score ON comment
    COMPUTED fn::calculate_score(votes.positive, votes.misleading, votes.negative, 1);
DEFINE FIELD moderation ON comment COMPUTED (
    SELECT locked, slowed
    FROM ONLY moderation
    WHERE subject = $parent.id
    LIMIT 1
);

DEFINE INDEX IF NOT EXISTS commentContentSearch ON TABLE comment
    FIELDS content FULLTEXT ANALYZER relevanceSearch BM25 HIGHLIGHTS;


-- ------------------------------
-- TABLE: thread
-- ------------------------------
DEFINE TABLE thread SCHEMAFULL;
DEFINE FIELD user ON thread
    TYPE record<user>;
DEFINE FIELD content ON thread
    TYPE string ASSERT $value = /.{4,512}/;
DEFINE FIELD tags ON thread
    TYPE array<string> DEFAULT ALWAYS []
    ASSERT $value.all(|$tag| $tag IN ["nsfw", "spoiler"]);
DEFINE FIELD time ON thread
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD quote ON thread
    TYPE option<record<thread>> ASSERT $value = NONE OR record::exists($value)
    REFERENCE ON DELETE UNSET;
DEFINE FIELD quotes ON thread
    COMPUTED <~(thread FIELD quote);
DEFINE FIELD replyTo ON thread
    TYPE option<record<thread>> ASSERT $value = NONE OR record::exists($value)
    REFERENCE ON DELETE REJECT;
DEFINE FIELD replies ON thread
    COMPUTED <~(thread FIELD replyTo);
DEFINE FIELD moderation ON thread COMPUTED (
    SELECT locked, slowed
    FROM ONLY moderation
    WHERE subject = $parent.id
    LIMIT 1
);
DEFINE FIELD topics ON thread
    TYPE array<record<topic>> DEFAULT ALWAYS []
    REFERENCE ON DELETE REJECT;
DEFINE FIELD images ON thread
    TYPE array<record<image>> DEFAULT ALWAYS [];
DEFINE FIELD status ON thread
    TYPE string ASSERT $value IN ["active", "archived", "quarantined", "deleted"] DEFAULT ALWAYS "active";
DEFINE FIELD deleted ON thread
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD edited ON thread
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD timeEdited ON thread
    TYPE option<datetime>;
DEFINE FIELD visits ON thread
    TYPE number DEFAULT ALWAYS 1;
DEFINE FIELD votes ON thread
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD votes.positive ON thread
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.misleading ON thread
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.negative ON thread
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.awards ON thread
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.saves ON thread
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD score ON thread
    COMPUTED fn::calculate_score(votes.positive, votes.misleading, votes.negative, visits);

DEFINE INDEX IF NOT EXISTS threadContentSearch ON TABLE thread
    FIELDS content FULLTEXT ANALYZER relevanceSearch BM25 HIGHLIGHTS;

DEFINE EVENT ensureTopics ON thread WHEN $event = 'CREATE' THEN {
    FOR $topic in $after.topics {
        IF !record::exists($topic) {
            CREATE $topic;
        }
    };
};


-- ------------------------------
-- TABLE: image
-- ------------------------------
DEFINE TABLE image SCHEMAFULL;
DEFINE FIELD user ON image
    TYPE record<user>;
DEFINE FIELD type ON image
    TYPE string ASSERT $value IN ["gif", "webp", "png", "jpeg", "mp3"];
DEFINE FIELD name ON image
    TYPE string DEFAULT ALWAYS "";
DEFINE FIELD time ON image
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD origin ON image
    TYPE string;
DEFINE FIELD url ON image
    COMPUTED string::concat(origin, "/cdn/image/", record::id(id));
DEFINE FIELD tokens ON image
    TYPE number DEFAULT ALWAYS 25000;
DEFINE FIELD status ON image
    TYPE string ASSERT $value IN ["active", "archived", "quarantined", "deleted"] DEFAULT ALWAYS "active";
DEFINE FIELD description ON image
    TYPE string DEFAULT ALWAYS "";
DEFINE FIELD visits ON image
    TYPE number DEFAULT ALWAYS 1;
DEFINE FIELD votes.positive ON image
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.misleading ON image
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.negative ON image
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD score ON image
    COMPUTED fn::calculate_score(votes.positive, votes.misleading, votes.negative, visits);

-- ------------------------------
-- TABLE: audio
-- ------------------------------
DEFINE TABLE audio SCHEMAFULL;
DEFINE FIELD user ON audio
    TYPE record<user>;
DEFINE FIELD type ON audio
    TYPE string ASSERT $value IN ["gif", "webp", "png", "jpeg", "mp3"];
DEFINE FIELD name ON audio
    TYPE string DEFAULT ALWAYS "";
DEFINE FIELD time ON audio
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD origin ON audio
    TYPE string;
DEFINE FIELD url ON audio
    COMPUTED string::concat(origin, "/cdn/audio/", record::id(id));
DEFINE FIELD tokens ON audio
    TYPE number DEFAULT ALWAYS 25000;
DEFINE FIELD visits ON audio
    TYPE number DEFAULT ALWAYS 1;
DEFINE FIELD votes.positive ON audio
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.misleading ON audio
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.negative ON audio
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.awards ON audio
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.saves ON audio
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD score ON audio
    COMPUTED fn::calculate_score(votes.positive, votes.misleading, votes.negative, visits);


-- ------------------------------
-- TABLE: gallery
-- ------------------------------
DEFINE TABLE gallery SCHEMAFULL;
DEFINE FIELD user ON gallery
    TYPE record<user>;
DEFINE FIELD title ON gallery
    TYPE string ASSERT $value.len() >= 4 AND $value.len() <= 128 DEFAULT ALWAYS "Gallery";
DEFINE FIELD description ON gallery
    TYPE string ASSERT $value.len() <= 256 DEFAULT ALWAYS "";
DEFINE FIELD tags ON gallery
    TYPE array<string> DEFAULT ALWAYS []
    ASSERT $value.all(|$tag| $tag IN ["nsfw", "spoiler"]);
DEFINE FIELD time ON gallery
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD topics ON gallery
    TYPE array<record<topic>> DEFAULT ALWAYS []
    REFERENCE ON DELETE REJECT;
DEFINE FIELD comments ON gallery
    COMPUTED <~(comment FIELD context);
DEFINE FIELD moderation ON gallery COMPUTED (
    SELECT locked, slowed
    FROM ONLY moderation
    WHERE subject = $parent.id
    LIMIT 1
);
DEFINE FIELD images ON gallery
    TYPE array<record<image>> DEFAULT ALWAYS [];
DEFINE FIELD status ON gallery
    TYPE string ASSERT $value IN ["active", "archived", "quarantined", "deleted"] DEFAULT ALWAYS "active";
DEFINE FIELD visits ON gallery
    TYPE number DEFAULT ALWAYS 1;
DEFINE FIELD votes ON gallery
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD votes.positive ON gallery
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.misleading ON gallery
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.negative ON gallery
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.awards ON gallery
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.saves ON gallery
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD score ON gallery
    COMPUTED fn::calculate_score(votes.positive, votes.misleading, votes.negative, visits);

DEFINE INDEX IF NOT EXISTS galleryTitleSearch ON TABLE gallery
    FIELDS title FULLTEXT ANALYZER relevanceSearch BM25 HIGHLIGHTS;
DEFINE INDEX IF NOT EXISTS galleryDescriptionSearch ON TABLE gallery
    FIELDS description FULLTEXT ANALYZER relevanceSearch BM25 HIGHLIGHTS;

DEFINE EVENT ensureTopics ON gallery WHEN $event = 'CREATE' THEN {
    FOR $topic IN $after.topics {
        IF !record::exists($topic) {
            CREATE $topic;
        }
    };
};

-- ------------------------------
-- TABLE: feed
-- ------------------------------
DEFINE TABLE feed AS
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
DEFINE FIELD hot ON feed
    COMPUTED fn::sort_hot(score, time, time::now());


-- ------------------------------
-- TABLE: mediaTrash
-- ------------------------------
DEFINE TABLE mediaTrash SCHEMAFULL;
DEFINE FIELD type ON mediaTrash
    TYPE string ASSERT $value IN ["image", "audio"];
DEFINE FIELD extension ON mediaTrash
    TYPE string ASSERT $value IN ["gif", "webp", "png", "jpeg", "mp3"];
DEFINE FIELD time ON mediaTrash
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD attempts ON mediaTrash
    TYPE int DEFAULT ALWAYS 0 ASSERT $value >= 0;
DEFINE FIELD retryAfter ON mediaTrash
    TYPE option<datetime>;
DEFINE FIELD lastError ON mediaTrash
    TYPE option<string> ASSERT $value = NONE OR $value.len() <= 1024;


-- ------------------------------
-- TABLE: pin
-- ------------------------------
DEFINE TABLE pin SCHEMAFULL;
DEFINE FIELD item ON pin
    TYPE record<post|thread|gallery|link>;
DEFINE FIELD scope ON pin
    TYPE string ASSERT $value IN ["app", "topic"] DEFAULT ALWAYS "app";
DEFINE FIELD topic ON pin
    TYPE option<record<topic>> REFERENCE ON DELETE CASCADE;
DEFINE FIELD user ON pin
    TYPE record<user>;
DEFINE FIELD active ON pin
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD time ON pin
    TYPE datetime DEFAULT ALWAYS time::now();

DEFINE INDEX pinItemScopeTopic ON TABLE pin
    FIELDS item, scope, topic UNIQUE;
DEFINE INDEX pinScopeTopicActive ON TABLE pin
    FIELDS scope, topic, active;


-- ------------------------------
-- TABLE: notification
-- ------------------------------
DEFINE TABLE notification SCHEMAFULL;
DEFINE FIELD recipient ON notification
    TYPE record<user>;
DEFINE FIELD context ON notification
    TYPE record<post|link|comment|user|thread|gallery|image|report|topic>;
DEFINE FIELD message ON notification
    TYPE string;
DEFINE FIELD time ON notification
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD viewed ON notification
    TYPE bool DEFAULT ALWAYS false;


-- ------------------------------
-- TABLE: userSettings
-- ------------------------------
DEFINE TABLE userSettings SCHEMAFULL;
DEFINE FIELD user ON userSettings
    TYPE record<user>;
DEFINE FIELD content.visibility ON userSettings
    TYPE object FLEXIBLE DEFAULT ALWAYS {};
DEFINE FIELD content.filters ON userSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD content.filters.muted ON userSettings
    TYPE array<record<user | topic>> DEFAULT ALWAYS [];
DEFINE FIELD content.filters.blocked ON userSettings
    TYPE array<record<user | topic>> DEFAULT ALWAYS [];
DEFINE FIELD privacy ON userSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD privacy.profile ON userSettings
    TYPE string DEFAULT ALWAYS "public" ASSERT $value IN ["public", "members", "private"];
DEFINE FIELD ui ON userSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD ui.hoverAnimations ON userSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD ui.hintDuration ON userSettings
    TYPE number DEFAULT ALWAYS 2500;
DEFINE FIELD notifications ON userSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD notifications.inApp ON userSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD notifications.email ON userSettings
    TYPE bool DEFAULT ALWAYS false;

DEFINE INDEX userSettingsUser ON TABLE userSettings
    FIELDS user UNIQUE;


-- ------------------------------
-- TABLE: feedback
-- ------------------------------
DEFINE TABLE feedback SCHEMAFULL;
DEFINE FIELD user ON feedback
    TYPE option<record<user>>;
DEFINE FIELD content ON feedback
    TYPE string;
DEFINE FIELD time ON feedback
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD dismissed ON feedback
    TYPE bool DEFAULT ALWAYS false;


-- ------------------------------
-- TABLE: report
-- ------------------------------
DEFINE TABLE report SCHEMAFULL;
DEFINE FIELD subject ON report
    TYPE record;
DEFINE FIELD owner ON report
    COMPUTED IF subject.user != NONE THEN subject.user.{ id, name } ELSE subject.{ id, name } END;
DEFINE FIELD topics ON report
    COMPUTED array::union(subject.topics ?? [], subject.context.topics ?? []);
DEFINE FIELD moderator ON report
    TYPE option<record<user>>;
DEFINE FIELD time ON report
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD complaints ON report
    TYPE array<object> DEFAULT ALWAYS [];
DEFINE FIELD complaints.*.user ON report
    TYPE record<user>;
DEFINE FIELD complaints.*.reason ON report
    TYPE string;
DEFINE FIELD complaints.*.time ON report
    TYPE datetime;
DEFINE FIELD status ON report
    TYPE string ASSERT $value IN ["pending", "removed", "appealed", "denied", "closed"] DEFAULT ALWAYS "pending";
DEFINE FIELD history ON report
    TYPE array<object> DEFAULT ALWAYS [];
DEFINE FIELD history.*.action ON report
    TYPE string;
DEFINE FIELD history.*.message ON report
    TYPE option<string> ASSERT $value.len() > 0;
DEFINE FIELD history.*.user ON report
    TYPE record<user>;
DEFINE FIELD history.*.time ON report
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD history.*.changes ON report
    TYPE object FLEXIBLE;

DEFINE INDEX subject ON TABLE report
    FIELDS subject UNIQUE;


-- ------------------------------
-- TABLE: moderation
-- ------------------------------
DEFINE TABLE moderation SCHEMAFULL;
DEFINE FIELD subject ON moderation
    TYPE record<post | link | gallery | comment | thread>
    ASSERT record::exists($value)
    REFERENCE ON DELETE CASCADE;
DEFINE FIELD locked ON moderation
    TYPE option<string> ASSERT $value = NONE OR $value = "item";
DEFINE FIELD slowed ON moderation
    TYPE option<int> ASSERT $value = NONE OR $value > 0;

DEFINE INDEX subject ON TABLE moderation
    FIELDS subject UNIQUE;


-- ------------------------------
-- FUNCTIONS: thread
-- ------------------------------
DEFINE FUNCTION fn::thread_ancestors($threadId: record<thread>, $remaining: int) -> array<object> {
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

DEFINE FUNCTION fn::thread_chain($parent: record<thread>, $remaining: int) -> array<object> {
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

DEFINE FUNCTION fn::thread_replies($replies: array<object>, $remaining: int) -> array<object> {
    IF $replies.len() = 0 {
        RETURN [];
    };
    LET $reply = $replies[0];
    LET $chain = fn::thread_chain($reply.id, $remaining);
    LET $reply = object::extend($reply, { chain: $chain });
    LET $tail = fn::thread_replies(array::slice($replies, 1, $replies.len()), $remaining);
    RETURN [$reply].concat($tail);
};


-- ------------------------------
-- TABLE: moderatorLog
-- ------------------------------
DEFINE TABLE moderatorLog SCHEMAFULL;
DEFINE FIELD actor ON moderatorLog
    TYPE record<user>;
DEFINE FIELD action ON moderatorLog
    TYPE string;
DEFINE FIELD target ON moderatorLog
    TYPE record;
DEFINE FIELD details ON moderatorLog
    TYPE object FLEXIBLE DEFAULT {};
DEFINE FIELD time ON moderatorLog
    TYPE datetime DEFAULT ALWAYS time::now();

DEFINE INDEX moderatorLogTime ON TABLE moderatorLog
    FIELDS time;
DEFINE INDEX moderatorLogActor ON TABLE moderatorLog
    FIELDS actor;
DEFINE INDEX moderatorLogTarget ON TABLE moderatorLog
    FIELDS target;

DEFINE EVENT moderatorLogReportUpdate ON report
    WHEN $event = 'UPDATE' AND $after.history.len() > $before.history.len()
    THEN {
        LET $entry = array::last($after.history);
        CREATE moderatorLog SET
            actor = $entry.user,
            action = $entry.action,
            target = $after.id,
            details = {
                before: { status: $entry.changes.status.before },
                after: { status: $entry.changes.status.after, message: $entry.message },
                topic: $entry.changes.topic,
                changes: $entry.changes
            };
    };


-- ------------------------------
-- TABLE: accountConfirmation
-- ------------------------------
DEFINE TABLE accountConfirmation SCHEMAFULL;
DEFINE FIELD account ON accountConfirmation
    TYPE record<account>;
DEFINE FIELD time ON accountConfirmation
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD used ON accountConfirmation
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD expired ON accountConfirmation
    COMPUTED time::now() > time + 15m;


-- ------------------------------
-- TABLE: passwordReset
-- ------------------------------
DEFINE TABLE passwordReset SCHEMAFULL;
DEFINE FIELD account ON passwordReset
    TYPE record<account>;
DEFINE FIELD time ON passwordReset
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD used ON passwordReset
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD expired ON passwordReset
    COMPUTED time::now() > time + 15m;


-- ------------------------------
-- TABLE: referralClaim
-- ------------------------------
DEFINE TABLE referralClaim SCHEMAFULL;
DEFINE FIELD claimant ON referralClaim
    TYPE record<user>;
DEFINE FIELD recipient ON referralClaim
    TYPE record<user>;
DEFINE FIELD time ON referralClaim
    TYPE datetime DEFAULT ALWAYS time::now();

DEFINE INDEX claimant ON referralClaim
    FIELDS claimant UNIQUE;


-- ------------------------------
-- TABLE: moderationRequest
-- ------------------------------
DEFINE TABLE moderationRequest SCHEMAFULL;
DEFINE FIELD user ON moderationRequest
    TYPE record<user>;
DEFINE FIELD topic ON moderationRequest
    TYPE record<topic>;
DEFINE FIELD approvals ON moderationRequest
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD denials ON moderationRequest
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD closed ON moderationRequest
    TYPE bool DEFAULT ALWAYS false;

DEFINE INDEX user_topic ON moderationRequest
    FIELDS user, topic UNIQUE;

DEFINE EVENT moderatorLogRequestApproval ON moderationRequest
    WHEN $event = 'UPDATE' AND $after.approvals.len() > $before.approvals.len()
    THEN {
        CREATE moderatorLog SET
            actor = array::last($after.approvals),
            action = 'moderation.request.approved',
            target = $after.id,
            details = { topic: $after.topic, applicant: $after.user };
    };
DEFINE EVENT moderatorLogRequestDenial ON moderationRequest
    WHEN $event = 'UPDATE' AND $after.denials.len() > $before.denials.len()
    THEN {
        CREATE moderatorLog SET
            actor = array::last($after.denials),
            action = 'moderation.request.denied',
            target = $after.id,
            details = { topic: $after.topic, applicant: $after.user };
    };


-- ------------------------------
-- TABLE: scheduledEmail
-- ------------------------------
DEFINE TABLE scheduledEmail SCHEMAFULL;
DEFINE FIELD status ON scheduledEmail
    TYPE string;
DEFINE FIELD time ON scheduledEmail
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD attempts ON scheduledEmail
    TYPE number DEFAULT ALWAYS 0;
DEFINE FIELD recipient ON scheduledEmail
    TYPE string ASSERT string::is_email($value);
DEFINE FIELD subject ON scheduledEmail
    TYPE string;
DEFINE FIELD text ON scheduledEmail
    TYPE option<string>;
DEFINE FIELD html ON scheduledEmail
    TYPE option<string>;


-- ------------------------------
-- TABLE: developerQuery
-- ------------------------------
DEFINE TABLE developerQuery SCHEMAFULL;
DEFINE FIELD user ON developerQuery
    TYPE record<user>;
DEFINE FIELD sql ON developerQuery
    TYPE string;
DEFINE FIELD results ON developerQuery
    TYPE any;
DEFINE FIELD time ON developerQuery
    TYPE datetime DEFAULT ALWAYS time::now();


-- ------------------------------
-- TABLE: error
-- ------------------------------
DEFINE TABLE error SCHEMAFULL;
DEFINE FIELD status ON error
    TYPE number;
DEFINE FIELD description ON error
    TYPE string;
DEFINE FIELD request ON error
    TYPE object FLEXIBLE;
DEFINE FIELD time ON error
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD user ON error
    TYPE record|string;
DEFINE FIELD stack ON error
    TYPE string;
DEFINE FIELD data ON error
    TYPE object FLEXIBLE;


-- ------------------------------
-- TABLE: appSettings
-- ------------------------------
DEFINE TABLE appSettings SCHEMAFULL;
DEFINE FIELD about ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD about.summary ON appSettings
    TYPE string DEFAULT ALWAYS "";
DEFINE FIELD email ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD email.support ON appSettings
    TYPE string DEFAULT ALWAYS "";
DEFINE FIELD email.additional ON appSettings
    TYPE string DEFAULT ALWAYS "";
DEFINE FIELD email.spool ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD email.spool.dailyLimit ON appSettings
    TYPE int DEFAULT ALWAYS 100 ASSERT $value >= 1 AND $value <= 100000;
DEFINE FIELD email.spool.batchLimit ON appSettings
    TYPE int DEFAULT ALWAYS 10 ASSERT $value >= 1 AND $value <= 1000;
DEFINE FIELD email.spool.maxRetries ON appSettings
    TYPE int DEFAULT ALWAYS 3 ASSERT $value >= 0 AND $value <= 10;
DEFINE FIELD moderation ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD moderation.perTopic ON appSettings
    TYPE int DEFAULT ALWAYS 3 ASSERT $value >= 0;
DEFINE FIELD moderation.threshold ON appSettings
    TYPE int DEFAULT ALWAYS 2 ASSERT $value >= 1;
DEFINE FIELD moderation.slowModes ON appSettings
    TYPE array<int> DEFAULT ALWAYS [30, 60, 300, 900]
    ASSERT $value.all(|$interval| $interval > 0);
DEFINE FIELD content ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD content.visibility ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD content.visibility.nsfw ON appSettings
    TYPE string DEFAULT ALWAYS "mask" ASSERT $value IN ["show", "mask", "filter"];
DEFINE FIELD content.visibility.spoiler ON appSettings
    TYPE string DEFAULT ALWAYS "mask" ASSERT $value IN ["show", "mask", "filter"];
DEFINE FIELD voting ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD voting.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD voting.misleading ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD voting.negative ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD topics ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD topics.perSubmission ON appSettings
    TYPE int DEFAULT ALWAYS 3 ASSERT $value >= 0 AND $value <= 5;
DEFINE FIELD topics.restrict ON appSettings
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD topics.allowed ON appSettings
    TYPE array<string> DEFAULT ALWAYS [];
DEFINE FIELD feeds ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD feeds.search ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD feeds.discover ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD feeds.topics ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD feeds.posts ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD feeds.links ON appSettings
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD feeds.threads ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD feeds.images ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD feeds.audio ON appSettings
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD feeds.video ON appSettings
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD feeds.polls ON appSettings
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD posts ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD posts.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD links ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD links.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD threads ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD threads.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD media ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD media.tokens ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD media.tokens.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD media.images ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD media.images.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD media.images.uploadLimit ON appSettings
    TYPE int DEFAULT ALWAYS 10 ASSERT $value >= 0 AND $value <= 100;
DEFINE FIELD media.images.attachments ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD media.images.attachments.posts ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD media.images.attachments.threads ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD media.gallery ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD media.gallery.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD media.audio ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD media.audio.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD media.audio.uploadLimit ON appSettings
    TYPE int DEFAULT ALWAYS 100 ASSERT $value >= 0 AND $value <= 500;
DEFINE FIELD media.video ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD media.video.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD media.video.uploadLimit ON appSettings
    TYPE int DEFAULT ALWAYS 500 ASSERT $value >= 0;
DEFINE FIELD polls ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD polls.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD misc ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD misc.feedback ON appSettings
    TYPE object DEFAULT ALWAYS {};
DEFINE FIELD misc.feedback.enabled ON appSettings
    TYPE bool DEFAULT ALWAYS true;
DEFINE FIELD misc.feedback.allowAnonymous ON appSettings
    TYPE bool DEFAULT ALWAYS false;

IF !record::exists(appSettings:default) {
    CREATE appSettings:default;
};