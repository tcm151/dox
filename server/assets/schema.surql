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


-- ------------------------------
-- TABLE: account
-- ------------------------------
DEFINE TABLE account SCHEMAFULL;
DEFINE FIELD email ON account
    TYPE string ASSERT string::is_email($value);
DEFINE INDEX email ON account
    FIELDS email UNIQUE;
DEFINE FIELD password ON account
    TYPE string;
DEFINE FIELD user ON account
    TYPE record<user>;
DEFINE INDEX user ON account
    FIELDS user UNIQUE;


-- ------------------------------
-- TABLE: user
-- ------------------------------
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD name ON user
    TYPE string ASSERT $value = /^[\w]{3,32}$/;
DEFINE INDEX name ON user
    FIELDS name UNIQUE;
DEFINE FIELD link ON user
    TYPE option<string>;
DEFINE FIELD description on user
    TYPE option<string>;
DEFINE FIELD dateJoined ON user
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD topics ON user
    TYPE array<record<topic>> DEFAULT ALWAYS [];
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
    TYPE number DEFAULT ALWAYS 0;
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
DEFINE FIELD votes ON user
    TYPE object DEFAULT ALWAYS { positive: [], misleading: [], negative: [], awards: [], saves: [] };
DEFINE FIELD score ON user
    COMPUTED fn::calculate_score(votes.positive, votes.misleading, votes.negative, visits);


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
DEFINE FIELD posts ON topic
    TYPE array<record<post>> DEFAULT ALWAYS [];
DEFINE FIELD threads ON topic
    TYPE array<record<thread>> DEFAULT ALWAYS [];
DEFINE FIELD galleries ON topic
    TYPE array<record<gallery>> DEFAULT ALWAYS [];
DEFINE FIELD visits ON topic
    TYPE number DEFAULT ALWAYS 0;
DEFINE FIELD followers ON topic
    COMPUTED SELECT VALUE id FROM user WHERE topics CONTAINS $parent.id;
DEFINE FIELD moderators ON topic
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD firstUsed ON topic
    COMPUTED time::min(array::filter(array::union(array::union(posts.time ?? [], threads.time ?? []), galleries.time ?? []), |$value| $value != NONE));
DEFINE FIELD votes.positive ON topic
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.misleading ON topic
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.negative ON topic
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD score ON topic
    COMPUTED fn::calculate_score(votes.positive, votes.misleading, votes.negative, visits);
DEFINE EVENT removeBlank ON topic WHEN $event = 'UPDATE' THEN {
    IF $after.posts.len() = 0 AND $after.threads.len() = 0 AND $after.galleries.len() = 0 {
        DELETE $after.id;
    };
};


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
DEFINE FIELD time ON post
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD replyTo ON post
    TYPE option<record<post>>;
DEFINE FIELD topics ON post
    TYPE array<record<topic>> DEFAULT ALWAYS [];
DEFINE FIELD comments ON post
    TYPE array<record<comment>> DEFAULT ALWAYS [];
DEFINE FIELD images ON post
    TYPE array<record<image>> DEFAULT ALWAYS [];
DEFINE FIELD archived ON post
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD deleted ON post
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD edited ON post
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD timeEdited ON post
    TYPE option<datetime>;
DEFINE FIELD visits ON post
    TYPE number DEFAULT ALWAYS 0;
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
DEFINE FIELD votes ON post
    TYPE object DEFAULT ALWAYS { positive: [], misleading: [], negative: [], awards: [], saves: [] };
DEFINE FIELD score ON post
    COMPUTED (votes.positive.len() - (<float>votes.misleading.len()/2) - votes.negative.len()) * visits;
DEFINE EVENT updateTopics ON post WHEN $event = 'CREATE' THEN {
    FOR $topic in $after.topics {
        IF !record::exists($topic) {
            CREATE $topic SET posts = [$after.id];
        }
        ELSE {
            UPDATE $topic SET posts += $after.id;
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
DEFINE FIELD post ON comment
    TYPE record<post>;
DEFINE FIELD content ON comment
    TYPE string;
DEFINE FIELD time ON comment
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD replyTo ON comment
    TYPE record<post | comment>;
DEFINE FIELD deleted ON comment
    TYPE bool DEFAULT ALWAYS false;
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
DEFINE FIELD score ON comment
    COMPUTED fn::calculate_score(votes.positive, votes.misleading, votes.negative, 1);
DEFINE EVENT updatePost ON comment WHEN $event = 'CREATE' THEN {
    UPDATE $after.post SET comments += $after.id;
};


-- ------------------------------
-- TABLE: thread
-- ------------------------------
DEFINE TABLE thread SCHEMAFULL;
DEFINE FIELD user ON thread
    TYPE record<user>;
DEFINE FIELD content ON thread
    TYPE string ASSERT $value = /.{4,512}/;
DEFINE FIELD time ON thread
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD quote ON thread
    TYPE option<record<thread>>;
DEFINE FIELD quotes ON thread
    TYPE array<record<thread>> DEFAULT ALWAYS [];
DEFINE FIELD replyTo ON thread
    TYPE option<record<thread>>;
DEFINE FIELD replies ON thread
    TYPE array<record<thread>> DEFAULT ALWAYS [];
DEFINE FIELD topics ON thread
    TYPE array<record<topic>> DEFAULT ALWAYS [];
DEFINE FIELD images ON thread
    TYPE array<record<image>> DEFAULT ALWAYS [];
DEFINE FIELD archived ON thread
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD deleted ON thread
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD edited ON thread
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD timeEdited ON thread
    TYPE option<datetime>;
DEFINE FIELD visits ON thread
    TYPE number DEFAULT ALWAYS 0;
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
DEFINE FIELD votes ON thread
    TYPE object DEFAULT ALWAYS { positive: [], misleading: [], negative: [], awards: [], saves: [] };
DEFINE FIELD score ON thread
    COMPUTED fn::calculate_score(votes.positive, votes.misleading, votes.negative, visits);
DEFINE EVENT updateTopics ON thread WHEN $event = 'CREATE' THEN {
    FOR $topic in $after.topics {
        IF !record::exists($topic) {
            CREATE $topic SET threads = [$after.id];
        }
        ELSE {
            UPDATE $topic SET threads += $after.id;
        }
    };
};
DEFINE EVENT updateReplyTo ON thread WHEN $event = 'CREATE' THEN {
    IF $after.replyTo != NONE {
        UPDATE $after.replyTo SET replies += $after.id;
    };
    IF $after.quote != NONE {
        UPDATE $after.quote SET quotes += $after.id;
    };
};


-- ------------------------------
-- TABLE: image
-- ------------------------------
DEFINE TABLE image SCHEMAFULL;
DEFINE FIELD user ON image
    TYPE record<user>;
DEFINE FIELD type ON image
    TYPE string;
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
DEFINE FIELD public ON image
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD description ON image
    TYPE string DEFAULT ALWAYS "";
DEFINE FIELD visits ON image
    TYPE number DEFAULT ALWAYS 0;
DEFINE FIELD votes.positive ON image
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.misleading ON image
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD votes.negative ON image
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD score ON image
    COMPUTED fn::calculate_score(votes.positive, votes.misleading, votes.negative, visits);


-- ------------------------------
-- TABLE: gallery
-- ------------------------------
DEFINE TABLE gallery SCHEMAFULL;
DEFINE FIELD user ON gallery
    TYPE record<user>;
DEFINE FIELD description ON gallery
    TYPE string DEFAULT ALWAYS "";
DEFINE FIELD time ON gallery
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD topics ON gallery
    TYPE array<record<topic>> DEFAULT ALWAYS [];
DEFINE FIELD images ON gallery
    TYPE array<record<image>> DEFAULT ALWAYS [];
DEFINE FIELD archived ON gallery
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD visits ON gallery
    TYPE number DEFAULT ALWAYS 0;
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
DEFINE FIELD votes ON gallery
    TYPE object DEFAULT ALWAYS { positive: [], misleading: [], negative: [], awards: [], saves: [] };
DEFINE FIELD score ON gallery
    COMPUTED fn::calculate_score(votes.positive, votes.misleading, votes.negative, visits);
DEFINE EVENT updateTopics ON gallery WHEN $event = 'CREATE' THEN {
    FOR $topic IN $after.topics {
        IF !record::exists($topic) {
            CREATE $topic SET galleries = [$after.id];
        }
        ELSE {
            UPDATE $topic SET galleries += $after.id;
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
FROM post, thread, gallery
WHERE IF id IS NONE THEN false ELSE (
    (record::tb(id) = 'post' AND archived != true)
    OR (record::tb(id) = 'thread' AND replyTo = NONE)
    OR (record::tb(id) = 'gallery' AND archived != true)
) END;
DEFINE FIELD hot ON feed
    COMPUTED fn::sort_hot(score, time, time::now());


-- ------------------------------
-- TABLE: mediaTrash
-- ------------------------------
DEFINE TABLE mediaTrash SCHEMAFULL;
DEFINE FIELD type ON mediaTrash
    TYPE string;
DEFINE FIELD extension ON mediaTrash
    TYPE string;
DEFINE FIELD time ON mediaTrash
    TYPE datetime DEFAULT ALWAYS time::now();


-- ------------------------------
-- TABLE: pin
-- ------------------------------
DEFINE TABLE pin SCHEMAFULL;
DEFINE FIELD item ON pin
    TYPE record<post|thread>;
DEFINE INDEX item ON pin
    FIELDS item UNIQUE;
DEFINE FIELD user ON pin
    TYPE record<user>;
DEFINE FIELD active ON pin
    TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD time ON pin
    TYPE datetime DEFAULT ALWAYS time::now();


-- ------------------------------
-- TABLE: notification
-- ------------------------------
DEFINE TABLE notification SCHEMAFULL;
DEFINE FIELD recipient ON notification
    TYPE record<user>;
DEFINE FIELD context ON notification
    TYPE record<post|comment|user|thread>;
DEFINE FIELD message ON notification
    TYPE string;
DEFINE FIELD time ON notification
    TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD viewed ON notification
    TYPE bool DEFAULT ALWAYS false;


-- ------------------------------
-- TABLE: feedback
-- ------------------------------
DEFINE TABLE feedback SCHEMAFULL;
DEFINE FIELD user ON feedback
    TYPE record<user>;
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
DEFINE FIELD reporter ON report
    TYPE record<user>;
DEFINE FIELD subject ON report
    TYPE record;
DEFINE FIELD time ON report
    TYPE datetime DEFAULT ALWAYS time::now();


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
DEFINE INDEX claimant ON referralClaim
    FIELDS claimant UNIQUE;
DEFINE FIELD time ON referralClaim
    TYPE datetime DEFAULT ALWAYS time::now();


-- ------------------------------
-- TABLE: moderationRequest
-- ------------------------------
DEFINE TABLE moderationRequest SCHEMAFULL;
DEFINE FIELD user ON moderationRequest
    TYPE record<user>;
DEFINE FIELD topic ON moderationRequest
    TYPE record<topic>;
DEFINE INDEX user_topic ON moderationRequest
    FIELDS user, topic UNIQUE;
DEFINE FIELD approvals ON moderationRequest
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD denials ON moderationRequest
    TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD closed ON moderationRequest
    TYPE bool DEFAULT ALWAYS false;


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
DEFINE FIELD email ON appSettings
    TYPE object FLEXIBLE;
DEFINE FIELD moderation ON appSettings
    TYPE object FLEXIBLE;
DEFINE FIELD voting ON appSettings
    TYPE object FLEXIBLE;
DEFINE FIELD topics ON appSettings
    TYPE object FLEXIBLE;
DEFINE FIELD feeds ON appSettings
    TYPE object FLEXIBLE;
DEFINE FIELD posts ON appSettings
    TYPE object FLEXIBLE;
DEFINE FIELD links ON appSettings
    TYPE object FLEXIBLE;
DEFINE FIELD threads ON appSettings
    TYPE object FLEXIBLE;
DEFINE FIELD media.tokens ON appSettings
    TYPE object FLEXIBLE;
DEFINE FIELD media.images ON appSettings
    TYPE object FLEXIBLE;
DEFINE FIELD media.audio ON appSettings
    TYPE object FLEXIBLE;
DEFINE FIELD media.video ON appSettings
    TYPE object FLEXIBLE;
DEFINE FIELD polls ON appSettings
    TYPE object FLEXIBLE;
DEFINE FIELD misc.feedback ON appSettings
    TYPE object FLEXIBLE;

IF !record::exists(appSettings:default) {
    CREATE appSettings:default CONTENT {
        email: {
            support: "",
            additional: "",
        },
        moderation: {
            perTopic: 3,
            threshold: 2,
        },
        voting: {
            enabled: true,
            misleading: true,
            negative: true,
        },
        topics: {
            enabled: true,
            perSubmission: 3,
            restrict: false,
            allowed: [],
        },
        feeds: {
            search: true,
            discover: true,
            topics: true,
            posts: true,
            links: false,
            threads: true,
            images: true,
            audio: false,
            video: false,
            polls: false,
        },
        posts: {
            enabled: true,
        },
        links: {
            enabled: false,
        },
        threads: {
            enabled: true,
        },
        media: {
            tokens: {
                enabled: false,
            },
            images: {
                enabled: true,
                uploadLimit: 10,
            },
            audio: {
                enabled: false,
                uploadLimit: 100,
            },
            video: {
                enabled: false,
                uploadLimit: 500,
            }
        },
        polls: {
            enabled: false,
        },
        misc: {
            feedback: {
                enabled: true,
                allowAnonymous: false,
            }
        },
    };
};