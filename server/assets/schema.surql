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

DEFINE TABLE user SCHEMALESS;

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

DEFINE FIELD votes.positive ON topic TYPE array DEFAULT [];
DEFINE FIELD votes.positive[*] ON topic TYPE record<user>;
DEFINE FIELD votes.misleading ON topic TYPE array DEFAULT [];
DEFINE FIELD votes.misleading[*] ON topic TYPE record<user>;
DEFINE FIELD votes.negative ON topic TYPE array DEFAULT [];
DEFINE FIELD votes.negative[*] ON topic TYPE record<user>;

DEFINE FIELD votes.score ON topic DEFAULT <future> {
    array::len(votes.positive) - (<float> array::len(votes.misleading) / 2) - array::len(votes.negative)
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

DEFINE FIELD edited ON draft TYPE bool DEFAULT false;
DEFINE FIELD timeEdited ON draft TYPE option<datetime>;

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

DEFINE EVENT updatePost ON comment WHEN $event = 'CREATE' THEN {
    LET $post = (SELECT VALUE post FROM $after);
    UPDATE $post SET comments += $after.id;
};

-- ------------------------------
-- TABLE: image
-- ------------------------------

DEFINE TABLE image SCHEMALESS;

DEFINE FIELD url ON image TYPE any;
DEFINE FIELD type ON image TYPE string;
DEFINE FIELD user ON image TYPE record<user>;
DEFINE FIELD time ON image TYPE datetime DEFAULT time::now();
DEFINE FIELD tokens ON image TYPE number;

-- ------------------------------
-- TABLE: notification
-- ------------------------------

DEFINE TABLE notification SCHEMALESS;

DEFINE FIELD recipient ON notification TYPE record<user>;
DEFINE FIELD context ON notification TYPE record<post | comment>;
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

-- ------------------------------
-- TABLE: report
-- ------------------------------

DEFINE TABLE report SCHEMALESS;

DEFINE FIELD reporter ON report TYPE record<user>;
DEFINE FIELD subject ON report TYPE record();
DEFINE FIELD time ON report TYPE datetime DEFAULT time::now();

-- ------------------------------
-- TABLE: error
-- ------------------------------

DEFINE TABLE error SCHEMALESS;