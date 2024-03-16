-- ------------------------------
-- FUNCTIONS
-- ------------------------------

DEFINE FUNCTION fn::days_since($time: datetime) {
    RETURN <float> (time::now() - $time) / 60 / 60 / 24;
};

-- ------------------------------
-- SCOPES
-- ------------------------------

-- WARN: invalidates current session token, only uncomment if necessary
-- DEFINE SCOPE account SESSION 1d
-- SIGNUP (
--     CREATE user SET
--     email = $email,
--     name = $username,
--     password = crypto::argon2::generate($password),
--     dateCreated = time::now()
-- )
-- SIGNIN (
--     SELECT *
--     FROM user
--     WHERE (email = $id OR name = $id)
--     AND crypto::argon2::compare(password, $password)
-- );

-- ------------------------------
-- ANALYZERS
-- ------------------------------

DEFINE ANALYZER relevanceSearch
TOKENIZERS camel, class
FILTERS ascii, snowball(english);

-- ------------------------------
-- TABLE: confirmation
-- ------------------------------

DEFINE TABLE confirmation SCHEMALESS;

-- ------------------------------
-- TABLE: passwordReset
-- ------------------------------

DEFINE TABLE passwordReset SCHEMALESS;

-- ------------------------------
-- TABLE: user
-- ------------------------------

DEFINE TABLE user SCHEMALESS PERMISSIONS
FOR select, update WHERE id = $auth.id
FOR create, delete WHERE admin = true;

DEFINE FIELD email ON user TYPE string ASSERT string::is::email($value);
DEFINE INDEX email ON user FIELDS email UNIQUE;
DEFINE FIELD name ON user TYPE string ASSERT $value = /^[\w]{3,32}$/;
DEFINE INDEX name ON user FIELDS name UNIQUE;

DEFINE FIELD link ON user TYPE option<string>;
DEFINE FIELD description on user TYPE option<string>;

DEFINE FIELD topics ON user TYPE array DEFAULT [];
DEFINE FIELD topics[*] ON user TYPE record<topic>;
DEFINE FIELD followers ON user TYPE array DEFAULT [];
DEFINE FIELD followers[*] ON user TYPE record<user>;
DEFINE FIELD following ON user TYPE array DEFAULT [];
DEFINE FIELD following[*] ON user TYPE record<user>;

DEFINE FIELD dateCreated ON user TYPE datetime DEFAULT time::now();
DEFINE FIELD tokens ON user TYPE int DEFAULT 0 ASSERT $value >= 0 AND $value <= 65536;
DEFINE FIELD confirmed ON user TYPE bool DEFAULT false;
DEFINE FIELD verified ON user TYPE bool DEFAULT false;
DEFINE FIELD admin ON user TYPE bool DEFAULT false;

DEFINE FIELD votes.positive ON user TYPE array DEFAULT [];
DEFINE FIELD votes.positive[*] ON user TYPE record<user>;
DEFINE FIELD votes.misleading ON user TYPE array DEFAULT [];
DEFINE FIELD votes.misleading[*] ON user TYPE record<user>;
DEFINE FIELD votes.negative ON user TYPE array DEFAULT [];
DEFINE FIELD votes.negative[*] ON user TYPE record<user>;

DEFINE FIELD votes.score ON user DEFAULT <future> {
    array::len(votes.positive) - (<float> array::len(votes.misleading) / 2) - array::len(votes.negative)
};

-- ------------------------------
-- TABLE: topic
-- ------------------------------

DEFINE TABLE topic SCHEMALESS;

DEFINE FIELD posts ON topic TYPE array DEFAULT [];
DEFINE FIELD posts[*] ON topic TYPE record<post>;
DEFINE FIELD threads ON topic TYPE array DEFAULT [];
DEFINE FIELD threads[*] ON topic TYPE record<thread>;

DEFINE FIELD votes.positive ON topic TYPE array DEFAULT [];
DEFINE FIELD votes.positive[*] ON topic TYPE record<user>;
DEFINE FIELD votes.misleading ON topic TYPE array DEFAULT [];
DEFINE FIELD votes.misleading[*] ON topic TYPE record<user>;
DEFINE FIELD votes.negative ON topic TYPE array DEFAULT [];
DEFINE FIELD votes.negative[*] ON topic TYPE record<user>;

DEFINE FIELD votes.score ON topic DEFAULT <future> {
    array::len(votes.positive) - (<float> array::len(votes.misleading) / 2) - array::len(votes.negative)
};

DEFINE FIELD followers ON topic DEFAULT <future> {
    LET $id = id;
    RETURN SELECT VALUE id
    FROM user
    WHERE topics CONTAINS $id;
};

DEFINE EVENT removeBlank ON topic WHEN $event = 'UPDATE' THEN {
    IF array::len($after.posts) = 0 {
        DELETE $after.id;
    };
};

-- ------------------------------
-- TABLE: post
-- ------------------------------

DEFINE TABLE post SCHEMALESS;

DEFINE FIELD user ON post TYPE record<user>;
DEFINE FIELD title ON post TYPE string ASSERT $value = /.{4,128}/;
DEFINE FIELD content ON post TYPE string;
DEFINE FIELD time ON post TYPE datetime DEFAULT time::now();
DEFINE FIELD replyTo ON post TYPE option<record<post>>;

DEFINE FIELD topics ON post TYPE array DEFAULT [];
DEFINE FIELD topics[*] ON post TYPE record<topic>;
DEFINE FIELD comments ON post TYPE array DEFAULT [];
DEFINE FIELD comments[*] ON post TYPE record<comment>;
DEFINE FIELD images ON post TYPE array DEFAULT [];
DEFINE FIELD images[*] ON post TYPE record<image>;

DEFINE FIELD edited ON post TYPE bool DEFAULT false;
DEFINE FIELD timeEdited ON post TYPE option<datetime>;
DEFINE FIELD visits ON post TYPE number DEFAULT 0;

DEFINE FIELD votes.positive ON post TYPE array DEFAULT [];
DEFINE FIELD votes.positive[*] ON post TYPE record<user>;
DEFINE FIELD votes.misleading ON post TYPE array DEFAULT [];
DEFINE FIELD votes.misleading[*] ON post TYPE record<user>;
DEFINE FIELD votes.negative ON post TYPE array DEFAULT [];
DEFINE FIELD votes.negative[*] ON post TYPE record<user>;
DEFINE FIELD votes.awards ON post TYPE array DEFAULT [];
DEFINE FIELD votes.awards[*] ON post TYPE record<user>;

DEFINE FIELD votes.score ON post DEFAULT <future> {
    array::len(votes.positive) - (<float> array::len(votes.misleading) / 2) - array::len(votes.negative)
};

DEFINE INDEX searchTitle
ON post COLUMNS title
SEARCH ANALYZER relevanceSearch
BM25 HIGHLIGHTS;

DEFINE INDEX searchContent
ON post COLUMNS content
SEARCH ANALYZER relevanceSearch
BM25 HIGHLIGHTS;

DEFINE EVENT updateTopics ON post WHEN $event = 'CREATE' THEN {
    FOR $topic in $after.topics {
        UPDATE $topic SET
        posts += $after.id;
    };
};

-- ------------------------------
-- TABLE: draft
-- ------------------------------

DEFINE TABLE draft SCHEMALESS;

DEFINE FIELD user ON draft TYPE record<user>;
DEFINE FIELD title ON draft TYPE string ASSERT $value = /.{4,128}/;
DEFINE FIELD content ON draft TYPE string;
DEFINE FIELD time ON draft TYPE datetime DEFAULT time::now();
DEFINE FIELD replyTo ON draft TYPE option<record<post>>;

DEFINE FIELD topics ON draft TYPE array DEFAULT [];
DEFINE FIELD topics[*] ON draft TYPE record<topic>;
DEFINE FIELD images ON post TYPE array DEFAULT [];
DEFINE FIELD images[*] ON post TYPE record<image>;

-- ------------------------------
-- TABLE: pin
-- ------------------------------

DEFINE TABLE pin SCHEMALESS;

DEFINE FIELD post ON pin TYPE record<post>;
DEFINE FIELD user ON pin TYPE record<user>;
DEFINE FIELD active ON pin TYPE bool DEFAULT false;
DEFINE FIELD time ON pin TYPE datetime DEFAULT time::now();

-- ------------------------------
-- TABLE: thread
-- ------------------------------

DEFINE TABLE thread SCHEMALESS;

DEFINE FIELD user ON thread TYPE record<user>;
DEFINE FIELD content ON thread TYPE string ASSERT $value = /.{4,512}/;;
DEFINE FIELD time ON thread TYPE datetime DEFAULT time::now();
DEFINE FIELD replyTo ON thread TYPE option<record<thread>>;

DEFINE FIELD topics ON thread TYPE array DEFAULT [];
DEFINE FIELD topics[*] ON thread TYPE record<topic>;
DEFINE FIELD images ON thread TYPE array DEFAULT [];
DEFINE FIELD images[*] ON thread TYPE record<image>;

DEFINE FIELD edited ON thread TYPE bool DEFAULT false;
DEFINE FIELD timeEdited ON thread TYPE option<datetime>;
DEFINE FIELD visits ON thread TYPE number DEFAULT 0;

DEFINE FIELD votes.positive ON thread TYPE array DEFAULT [];
DEFINE FIELD votes.positive[*] ON thread TYPE record<user>;
DEFINE FIELD votes.misleading ON thread TYPE array DEFAULT [];
DEFINE FIELD votes.misleading[*] ON thread TYPE record<user>;
DEFINE FIELD votes.negative ON thread TYPE array DEFAULT [];
DEFINE FIELD votes.negative[*] ON thread TYPE record<user>;
DEFINE FIELD votes.awards ON thread TYPE array DEFAULT [];
DEFINE FIELD votes.awards[*] ON thread TYPE record<user>;

DEFINE FIELD votes.score ON thread DEFAULT <future> {
    array::len(votes.positive) - (<float> array::len(votes.misleading) / 2) - array::len(votes.negative)
};

DEFINE INDEX searchContent
ON thread COLUMNS content
SEARCH ANALYZER relevanceSearch
BM25 HIGHLIGHTS;

DEFINE EVENT updateTopics ON thread WHEN $event = 'CREATE' THEN {
    FOR $topic in $after.topics {
        UPDATE $topic SET
        threads += $after.id;
    };
};

-- ------------------------------
-- TABLE: comment
-- ------------------------------

DEFINE TABLE comment SCHEMALESS;

DEFINE FIELD user ON comment TYPE record<user>;
DEFINE FIELD post ON comment TYPE record<post>;
DEFINE FIELD content ON comment TYPE string;
DEFINE FIELD time ON comment TYPE datetime DEFAULT time::now();
DEFINE FIELD replyTo ON comment TYPE record<post | comment>;
DEFINE FIELD edited ON comment TYPE bool DEFAULT false;
DEFINE FIELD timeEdited ON comment TYPE option<datetime>;

DEFINE FIELD votes.positive ON comment TYPE array DEFAULT [];
DEFINE FIELD votes.positive[*] ON comment TYPE record<user>;
DEFINE FIELD votes.misleading ON comment TYPE array DEFAULT [];
DEFINE FIELD votes.misleading[*] ON comment TYPE record<user>;
DEFINE FIELD votes.negative ON comment TYPE array DEFAULT [];
DEFINE FIELD votes.negative[*] ON comment TYPE record<user>;

DEFINE FIELD votes.score ON comment DEFAULT <future> {
    array::len(votes.positive) - (<float> array::len(votes.misleading) / 2) - array::len(votes.negative)
};

DEFINE INDEX searchContent
ON comment COLUMNS content
SEARCH ANALYZER relevanceSearch
BM25 HIGHLIGHTS;

DEFINE EVENT updatePost ON comment WHEN $event = 'CREATE' THEN {
    LET $post = (SELECT VALUE post FROM $after);
    UPDATE $post SET comments += $after.id;
};

-- ------------------------------
-- TABLE: image
-- ------------------------------

DEFINE TABLE image SCHEMALESS;

DEFINE FIELD user ON image TYPE record<user>;
DEFINE FIELD type ON image TYPE string;
DEFINE FIELD tokens ON image TYPE number;
DEFINE FIELD time ON image TYPE datetime DEFAULT time::now();
DEFINE FIELD url ON image TYPE any;

-- ------------------------------
-- TABLE: notification
-- ------------------------------

DEFINE TABLE notification SCHEMALESS;

DEFINE FIELD recipient ON notification TYPE record<user>;
DEFINE FIELD context ON notification TYPE record<post | comment | user>;
DEFINE FIELD message ON notification TYPE string;
DEFINE FIELD time ON notification TYPE datetime DEFAULT time::now();
DEFINE FIELD viewed ON notification TYPE bool DEFAULT false;

-- ------------------------------
-- TABLE: feedback
-- ------------------------------

DEFINE TABLE feedback SCHEMALESS;

DEFINE FIELD user ON feedback TYPE record<user>;
DEFINE FIELD time ON feedback TYPE datetime DEFAULT time::now();
DEFINE FIELD content ON feedback TYPE string;
DEFINE FIELD dismissed ON feedback TYPE bool DEFAULT false;
DEFINE FIELD promoted ON feedback TYPE bool DEFAULT false;

-- ------------------------------
-- TABLE: report
-- ------------------------------

DEFINE TABLE report SCHEMALESS;

DEFINE FIELD reporter ON report TYPE record<user>;
DEFINE FIELD subject ON report TYPE record;
DEFINE FIELD time ON report TYPE datetime DEFAULT time::now();

-- ------------------------------
-- TABLE: error
-- ------------------------------

DEFINE TABLE error SCHEMALESS;