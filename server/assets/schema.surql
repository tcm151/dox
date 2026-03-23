-- ------------------------------
-- FUNCTIONS
-- ------------------------------
DEFINE FUNCTION OVERWRITE fn::days_since($time: datetime) {
    RETURN <float> (time::now() - $time) / 60 / 60 / 24;
};


-- ------------------------------
-- SCOPES
-- ------------------------------
-- WARN: invalidates current session token, only uncomment if necessary
DEFINE ACCESS OVERWRITE account ON DATABASE TYPE RECORD
SIGNUP (
    CREATE user SET
    email = $email,
    name = $username,
    password = crypto::argon2::generate($password),
    dateJoined = time::now()
)
SIGNIN (
    SELECT *
    OMIT password
    FROM user
    WHERE (email = $id OR name = $id)
    AND crypto::argon2::compare(password, $password)
)
DURATION FOR TOKEN 1h, FOR SESSION 14d
;


-- ------------------------------
-- ANALYZERS
-- ------------------------------
-- DEFINE ANALYZER OVERWRITE relevanceSearch
-- TOKENIZERS class, camel
-- FILTERS lowercase, ascii, snowball(english)
-- ;

-- ------------------------------
-- TABLE: appSettings
-- ------------------------------
DEFINE TABLE OVERWRITE appSettings SCHEMALESS;
IF !(SELECT * FROM appSettings) {
    CREATE appSettings:default CONTENT {
        navbar: {
            showStore: false,
            showFeedback: true,
        },
        feed: {
            showSearch: false,
            showTopics: true,
            showThreads: true,
            showImages: true,
        },
        voting: {
            showMisleading: true,
            showNegative: true,
        }
    };
};


-- ------------------------------
-- TABLE: confirmation
-- ------------------------------
DEFINE TABLE OVERWRITE confirmation SCHEMALESS;
DEFINE FIELD OVERWRITE user ON confirmation TYPE record<user>;
DEFINE FIELD OVERWRITE time ON confirmation TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD OVERWRITE used ON confirmation TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD OVERWRITE expired ON confirmation COMPUTED 
    time::now() > time + 15m;


-- ------------------------------
-- TABLE: passwordReset
-- ------------------------------
DEFINE TABLE OVERWRITE passwordReset SCHEMALESS;
DEFINE FIELD OVERWRITE user ON passwordReset TYPE record<user>;
DEFINE FIELD OVERWRITE time ON passwordReset TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD OVERWRITE used ON passwordReset TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD OVERWRITE expired ON passwordReset COMPUTED
    time::now() > time + 15m;


-- ------------------------------
-- TABLE: user
-- ------------------------------
DEFINE TABLE OVERWRITE user SCHEMALESS
PERMISSIONS
    FOR select, create, update, delete WHERE id = $auth.id;

DEFINE FIELD OVERWRITE email ON user TYPE string ASSERT string::is_email($value);
DEFINE INDEX OVERWRITE email ON user FIELDS email UNIQUE;
DEFINE FIELD OVERWRITE name ON user TYPE string ASSERT $value = /^[\w]{3,32}$/;
DEFINE INDEX OVERWRITE name ON user FIELDS name UNIQUE;

DEFINE FIELD OVERWRITE link ON user TYPE option<string>;
DEFINE FIELD OVERWRITE description on user TYPE option<string>;

DEFINE FIELD OVERWRITE topics ON user TYPE array<record<topic>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE followers ON user TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE following ON user TYPE array<record<user>> DEFAULT ALWAYS [];

DEFINE FIELD OVERWRITE dateJoined ON user TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD OVERWRITE tokens ON user TYPE int DEFAULT ALWAYS 5000 ASSERT $value >= 0 AND $value <= 65536;
DEFINE FIELD OVERWRITE roles ON user TYPE array<string> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE traits ON user TYPE array<string> DEFAULT ALWAYS [];

DEFINE FIELD OVERWRITE votes ON user TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE votes.positive ON user TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.misleading ON user TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.negative ON user TYPE array<record<user>> DEFAULT ALWAYS [];

DEFINE FIELD OVERWRITE score ON user COMPUTED
    (array::len(votes.positive) - (<float>array::len(votes.misleading)/2) - array::len(votes.negative));

-- ------------------------------
-- TABLE: session
-- ------------------------------
DEFINE TABLE OVERWRITE session SCHEMALESS;
DEFINE FIELD OVERWRITE user ON session TYPE record<user>;
DEFINE FIELD OVERWRITE time ON session TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD OVERWRITE invalidated ON session TYPE bool DEFAULT ALWAYS false;


-- ------------------------------
-- TABLE: topic
-- ------------------------------
DEFINE TABLE OVERWRITE topic SCHEMALESS;
DEFINE FIELD OVERWRITE posts ON topic TYPE array<record<post>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE threads ON topic TYPE array<record<thread>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE visits ON topic TYPE number DEFAULT ALWAYS 1;

DEFINE FIELD OVERWRITE votes ON topic TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE votes.positive ON topic TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.misleading ON topic TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.negative ON topic TYPE array<record<user>> DEFAULT ALWAYS [];

DEFINE FIELD OVERWRITE score ON topic COMPUTED
    (array::len(votes.positive) - (<float>array::len(votes.misleading)/2) - array::len(votes.negative)) * visits;

DEFINE FIELD OVERWRITE followers ON topic COMPUTED
    SELECT VALUE id FROM user WHERE topics CONTAINS $parent.id;

DEFINE FIELD OVERWRITE firstUsed ON topic COMPUTED
    time::min(array::union(posts.time, threads.time));

DEFINE EVENT OVERWRITE removeBlank ON topic WHEN $event = 'UPDATE' THEN {
    IF array::len($after.posts) = 0 AND array::len($after.threads) = 0 {
        DELETE $after.id;
    };
};


-- ------------------------------
-- TABLE: post
-- ------------------------------
DEFINE TABLE OVERWRITE post SCHEMALESS;
DEFINE FIELD OVERWRITE user ON post TYPE record<user>;
DEFINE FIELD OVERWRITE title ON post TYPE string ASSERT $value = /.{4,128}/;
DEFINE FIELD OVERWRITE content ON post TYPE string;
DEFINE FIELD OVERWRITE time ON post TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD OVERWRITE replyTo ON post TYPE option<record<post>>;

DEFINE FIELD OVERWRITE topics ON post TYPE array<record<topic>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE comments ON post TYPE array<record<comment>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE images ON post TYPE array<record<image>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE images[*] ON post TYPE record<image>;

DEFINE FIELD OVERWRITE archived ON post TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD OVERWRITE edited ON post TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD OVERWRITE timeEdited ON post TYPE option<datetime>;
DEFINE FIELD OVERWRITE visits ON post TYPE number DEFAULT ALWAYS 1;

DEFINE FIELD OVERWRITE votes ON post TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE votes.positive ON post TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.misleading ON post TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.negative ON post TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.awards ON post TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.saves ON post TYPE array<record<user>> DEFAULT ALWAYS [];

DEFINE FIELD OVERWRITE score ON post COMPUTED
    (array::len(votes.positive) - (<float>array::len(votes.misleading)/2) - array::len(votes.negative)) * visits;

DEFINE EVENT OVERWRITE updateTopics ON post WHEN $event = 'CREATE' THEN {
    FOR $topic in $after.topics {
        IF !record::exists($topic) {
            CREATE $topic SET threads = [$after.id];
        }
        ELSE {
            UPDATE $topic SET threads += $after.id;
        }
    };
};


-- ------------------------------
-- TABLE: draft
-- ------------------------------
DEFINE TABLE OVERWRITE draft SCHEMALESS;
DEFINE FIELD OVERWRITE user ON draft TYPE record<user>;
DEFINE FIELD OVERWRITE title ON draft TYPE string ASSERT $value = /.{4,128}/;
DEFINE FIELD OVERWRITE content ON draft TYPE string;
DEFINE FIELD OVERWRITE time ON draft TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD OVERWRITE replyTo ON draft TYPE option<record<post>>;

DEFINE FIELD OVERWRITE topics ON draft TYPE array<record<topic>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE images ON draft TYPE array<record<image>> DEFAULT ALWAYS [];


-- ------------------------------
-- TABLE: pin
-- ------------------------------
DEFINE TABLE OVERWRITE pin SCHEMALESS;
DEFINE FIELD OVERWRITE post ON pin TYPE record<post>;
DEFINE FIELD OVERWRITE user ON pin TYPE record<user>;
DEFINE FIELD OVERWRITE active ON pin TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD OVERWRITE time ON pin TYPE datetime DEFAULT ALWAYS time::now();


-- ------------------------------
-- TABLE: thread
-- ------------------------------
DEFINE TABLE OVERWRITE thread SCHEMALESS;
DEFINE FIELD OVERWRITE user ON thread TYPE record<user>;
DEFINE FIELD OVERWRITE content ON thread TYPE string ASSERT $value = /.{4,512}/;
DEFINE FIELD OVERWRITE time ON thread TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD OVERWRITE replyTo ON thread TYPE option<record<thread>>;

DEFINE FIELD OVERWRITE topics ON thread TYPE array<record<topic>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE replies ON thread TYPE array<record<thread>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE images ON thread TYPE array<record<image>> DEFAULT ALWAYS [];

DEFINE FIELD OVERWRITE edited ON thread TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD OVERWRITE timeEdited ON thread TYPE option<datetime>;
DEFINE FIELD OVERWRITE visits ON thread TYPE number DEFAULT ALWAYS 1;

DEFINE FIELD OVERWRITE votes ON thread TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE votes.positive ON thread TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.misleading ON thread TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.negative ON thread TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.awards ON thread TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.saves ON thread TYPE array<record<user>> DEFAULT ALWAYS [];

DEFINE FIELD OVERWRITE score ON thread COMPUTED
    (array::len(votes.positive) - (<float>array::len(votes.misleading)/2) - array::len(votes.negative)) * visits;

DEFINE EVENT OVERWRITE updateTopics ON thread WHEN $event = 'CREATE' THEN {
    FOR $topic in $after.topics {
        IF !record::exists($topic) {
            CREATE $topic SET threads = [$after.id];
        }
        ELSE {
            UPDATE $topic SET threads += $after.id;
        }
    };
};

DEFINE EVENT OVERWRITE updateReplyTo ON thread WHEN $event = 'CREATE' THEN {
    IF $after.replyTo != NONE {
        UPDATE $after.replyTo SET replies += $after.id;
    };
    IF $after.quote != NONE {
        UPDATE $after.quote SET quotes += $after.id;
    };
};


-- ------------------------------
-- TABLE: comment
-- ------------------------------
DEFINE TABLE OVERWRITE comment SCHEMALESS;
DEFINE FIELD OVERWRITE user ON comment TYPE record<user>;
DEFINE FIELD OVERWRITE post ON comment TYPE record<post>;
DEFINE FIELD OVERWRITE content ON comment TYPE string;
DEFINE FIELD OVERWRITE time ON comment TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD OVERWRITE replyTo ON comment TYPE record<post | comment>;
DEFINE FIELD OVERWRITE edited ON comment TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD OVERWRITE deleted ON comment TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD OVERWRITE timeEdited ON comment TYPE option<datetime>;

DEFINE FIELD OVERWRITE votes ON comment TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE votes.positive ON comment TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.misleading ON comment TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.negative ON comment TYPE array<record<user>> DEFAULT ALWAYS [];

DEFINE FIELD OVERWRITE score ON comment COMPUTED
    (array::len(votes.positive) - (<float>array::len(votes.misleading)/2) - array::len(votes.negative));

DEFINE EVENT OVERWRITE updatePost ON comment WHEN $event = 'CREATE' THEN {
    UPDATE $after.post SET comments += $after.id;
};


-- ------------------------------
-- TABLE: image
-- ------------------------------
DEFINE TABLE OVERWRITE image SCHEMALESS;
DEFINE FIELD OVERWRITE user ON image TYPE record<user>;
DEFINE FIELD OVERWRITE type ON image TYPE string;
DEFINE FIELD OVERWRITE tokens ON image TYPE number DEFAULT ALWAYS 25000;
DEFINE FIELD OVERWRITE time ON image TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD OVERWRITE visits ON image TYPE number DEFAULT ALWAYS 1;
DEFINE FIELD OVERWRITE url ON image TYPE any;

DEFINE FIELD OVERWRITE votes ON image TYPE object DEFAULT ALWAYS {};
DEFINE FIELD OVERWRITE votes.positive ON image TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.misleading ON image TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.negative ON image TYPE array<record<user>> DEFAULT ALWAYS [];

DEFINE FIELD OVERWRITE url ON image COMPUTED
    string::concat(origin, "/cdn/image/", record::id(id));

DEFINE FIELD OVERWRITE score ON image COMPUTED
    (array::len(votes.positive) - (<float>array::len(votes.misleading)/2) - array::len(votes.negative)) * visits;


-- ------------------------------
-- TABLE: notification
-- ------------------------------
DEFINE TABLE OVERWRITE notification SCHEMALESS;
DEFINE FIELD OVERWRITE recipient ON notification TYPE record<user>;
DEFINE FIELD OVERWRITE context ON notification TYPE record<post|comment|user|thread>;
DEFINE FIELD OVERWRITE message ON notification TYPE string;
DEFINE FIELD OVERWRITE time ON notification TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD OVERWRITE viewed ON notification TYPE bool DEFAULT ALWAYS false;


-- ------------------------------
-- TABLE: feedback
-- ------------------------------
DEFINE TABLE OVERWRITE feedback SCHEMALESS;
DEFINE FIELD OVERWRITE user ON feedback TYPE record<user>;
DEFINE FIELD OVERWRITE time ON feedback TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD OVERWRITE content ON feedback TYPE string;
DEFINE FIELD OVERWRITE dismissed ON feedback TYPE bool DEFAULT ALWAYS false;


-- ------------------------------
-- TABLE: report
-- ------------------------------
DEFINE TABLE OVERWRITE report SCHEMALESS;
DEFINE FIELD OVERWRITE reporter ON report TYPE record<user>;
DEFINE FIELD OVERWRITE subject ON report TYPE record;
DEFINE FIELD OVERWRITE time ON report TYPE datetime DEFAULT ALWAYS time::now();


-- ------------------------------
-- TABLE: error
-- ------------------------------
DEFINE TABLE OVERWRITE error SCHEMALESS;