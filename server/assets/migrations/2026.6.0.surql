REMOVE TABLE IF EXISTS feed;

BEGIN TRANSACTION;

DEFINE TABLE IF NOT EXISTS migration SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS version ON migration
	TYPE string;
DEFINE FIELD IF NOT EXISTS time ON migration
	TYPE datetime DEFAULT ALWAYS time::now();
DEFINE INDEX IF NOT EXISTS version ON migration
	FIELDS version UNIQUE;

DEFINE TABLE OVERWRITE mediaTrash SCHEMAFULL;
DEFINE FIELD OVERWRITE type ON mediaTrash
	TYPE string;
DEFINE FIELD OVERWRITE extension ON mediaTrash
	TYPE string;
DEFINE FIELD OVERWRITE time ON mediaTrash
	TYPE datetime DEFAULT ALWAYS time::now();

DEFINE FIELD OVERWRITE deleted ON post
	TYPE bool DEFAULT ALWAYS false;
UPDATE post SET deleted = false WHERE deleted IS NONE;

DEFINE FIELD OVERWRITE description ON image
	TYPE string DEFAULT ALWAYS "";
UPDATE image SET description = "" WHERE description IS NONE;

REMOVE INDEX IF EXISTS claimant_recipient ON referralClaim;
DEFINE INDEX OVERWRITE claimant ON referralClaim
	FIELDS claimant UNIQUE;

DEFINE FUNCTION OVERWRITE fn::sort_hot($score: number, $created_at: datetime, $as_of: datetime) -> number {
    LET $age_hours = math::max([1, (time::unix($as_of) - time::unix($created_at)) / 3600]);
    RETURN <float>$score / math::pow($age_hours, 2);
};
DEFINE FUNCTION OVERWRITE fn::calculate_score(
	$positive: array<record<user>>,
	$misleading: array<record<user>>,
	$negative: array<record<user>>,
	$visits: number
) -> number {
	RETURN ($positive.len() - (<float>$misleading.len()/2) - $negative.len()) * $visits;
};
DEFINE FUNCTION OVERWRITE fn::http($status: int, $message: string) {
	THROW string::concat("APP_ERROR:", <string>$status, ":", $message);
};

REMOVE FIELD IF EXISTS score ON post;
REMOVE FIELD IF EXISTS score ON thread;

DEFINE FIELD OVERWRITE votes ON post
	TYPE object DEFAULT ALWAYS { positive: [], misleading: [], negative: [], awards: [], saves: [] };
DEFINE FIELD OVERWRITE votes ON thread
	TYPE object DEFAULT ALWAYS { positive: [], misleading: [], negative: [], awards: [], saves: [] };
DEFINE FIELD OVERWRITE votes.awards ON user
	TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.saves ON user
	TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes ON user
	TYPE object DEFAULT ALWAYS { positive: [], misleading: [], negative: [], awards: [], saves: [] };

UPDATE user SET votes = {
	positive: votes.positive ?? [],
	misleading: votes.misleading ?? [],
	negative: votes.negative ?? [],
	awards: votes.awards ?? [],
	saves: votes.saves ?? []
} WHERE votes IS NONE OR votes.positive IS NONE OR votes.misleading IS NONE OR votes.negative IS NONE OR votes.awards IS NONE OR votes.saves IS NONE;

DEFINE TABLE OVERWRITE gallery SCHEMAFULL;
REMOVE FIELD IF EXISTS score ON gallery;
DEFINE FIELD OVERWRITE user ON gallery
	TYPE record<user>;
DEFINE FIELD OVERWRITE description ON gallery
	TYPE string DEFAULT ALWAYS "";
DEFINE FIELD OVERWRITE time ON gallery
	TYPE datetime DEFAULT ALWAYS time::now();
DEFINE FIELD OVERWRITE topics ON gallery
	TYPE array<record<topic>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE images ON gallery
	TYPE array<record<image>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE archived ON gallery
	TYPE bool DEFAULT ALWAYS false;
DEFINE FIELD OVERWRITE visits ON gallery
	TYPE number DEFAULT ALWAYS 0;
DEFINE FIELD OVERWRITE votes.positive ON gallery
	TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.misleading ON gallery
	TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.negative ON gallery
	TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.awards ON gallery
	TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes.saves ON gallery
	TYPE array<record<user>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE votes ON gallery
	TYPE object DEFAULT ALWAYS { positive: [], misleading: [], negative: [], awards: [], saves: [] };

UPDATE post SET votes = {
	positive: votes.positive ?? [],
	misleading: votes.misleading ?? [],
	negative: votes.negative ?? [],
	awards: votes.awards ?? [],
	saves: votes.saves ?? []
} WHERE votes IS NONE OR votes.positive IS NONE OR votes.misleading IS NONE OR votes.negative IS NONE OR votes.awards IS NONE OR votes.saves IS NONE;
UPDATE post SET visits = 0 WHERE visits IS NONE;

UPDATE thread SET votes = {
	positive: votes.positive ?? [],
	misleading: votes.misleading ?? [],
	negative: votes.negative ?? [],
	awards: votes.awards ?? [],
	saves: votes.saves ?? []
} WHERE votes IS NONE OR votes.positive IS NONE OR votes.misleading IS NONE OR votes.negative IS NONE OR votes.awards IS NONE OR votes.saves IS NONE;
UPDATE thread SET visits = 0 WHERE visits IS NONE;

UPDATE gallery SET votes = {
	positive: votes.positive ?? [],
	misleading: votes.misleading ?? [],
	negative: votes.negative ?? [],
	awards: votes.awards ?? [],
	saves: votes.saves ?? []
} WHERE votes IS NONE OR votes.positive IS NONE OR votes.misleading IS NONE OR votes.negative IS NONE OR votes.awards IS NONE OR votes.saves IS NONE;
UPDATE gallery SET visits = 0 WHERE visits IS NONE;

DEFINE FIELD OVERWRITE score ON user
	COMPUTED fn::calculate_score(votes.positive, votes.misleading, votes.negative, visits);
DEFINE FIELD OVERWRITE score ON topic
	COMPUTED fn::calculate_score(votes.positive, votes.misleading, votes.negative, visits);
DEFINE FIELD OVERWRITE score ON comment
	COMPUTED fn::calculate_score(votes.positive, votes.misleading, votes.negative, 1);
DEFINE FIELD OVERWRITE score ON post
	COMPUTED fn::calculate_score(votes.positive, votes.misleading, votes.negative, visits);
DEFINE FIELD OVERWRITE score ON thread
	COMPUTED fn::calculate_score(votes.positive, votes.misleading, votes.negative, visits);
DEFINE FIELD OVERWRITE score ON image
	COMPUTED fn::calculate_score(votes.positive, votes.misleading, votes.negative, visits);
DEFINE FIELD OVERWRITE score ON gallery
	COMPUTED fn::calculate_score(votes.positive, votes.misleading, votes.negative, visits);

DEFINE FIELD OVERWRITE galleries ON topic
	TYPE array<record<gallery>> DEFAULT ALWAYS [];
DEFINE FIELD OVERWRITE firstUsed ON topic
	COMPUTED time::min(array::filter(array::union(array::union(posts.time ?? [], threads.time ?? []), galleries.time ?? []), |$value| $value != NONE));

REMOVE EVENT IF EXISTS removeBlank ON topic;
REMOVE EVENT IF EXISTS updateTopics ON gallery;

LET $publicImages = SELECT * FROM image WHERE public = true;
FOR $image IN $publicImages {
	LET $existingGallery = SELECT VALUE id FROM gallery WHERE images CONTAINS $image.id LIMIT 1;
	IF $existingGallery.len() = 0 {
		CREATE gallery SET
			user = $image.user,
			description = $image.description ?? "",
			time = $image.time,
			topics = $image.topics ?? [],
			images = [$image.id],
			visits = $image.visits ?? 0,
			votes.positive = $image.votes.positive ?? [],
			votes.misleading = $image.votes.misleading ?? [],
			votes.negative = $image.votes.negative ?? [];
	};
};

REMOVE FIELD IF EXISTS topics ON image;
UPDATE image UNSET topics;

LET $topics = SELECT VALUE id FROM topic;
FOR $topic IN $topics {
	LET $posts = SELECT VALUE id FROM post WHERE topics CONTAINS $topic AND deleted = false;
	LET $threads = SELECT VALUE id FROM thread WHERE topics CONTAINS $topic AND deleted = false;
	LET $galleries = SELECT VALUE id FROM gallery WHERE topics CONTAINS $topic;
	UPDATE $topic SET posts = $posts, threads = $threads, galleries = $galleries;
};

LET $orphanedTopics = SELECT VALUE id FROM topic
	WHERE posts.len() = 0 AND threads.len() = 0 AND galleries.len() = 0;
FOR $topic IN $orphanedTopics {
	DELETE $topic;
};

DEFINE EVENT OVERWRITE removeBlank ON topic WHEN $event = 'UPDATE' THEN {
	IF $after.posts.len() = 0 AND $after.threads.len() = 0 AND $after.galleries.len() = 0 {
		DELETE $after.id;
	};
};

DEFINE EVENT OVERWRITE updateTopics ON gallery WHEN $event = 'CREATE' THEN {
	FOR $topic IN $after.topics {
		IF !record::exists($topic) {
			CREATE $topic SET galleries = [$after.id];
		}
		ELSE {
			UPDATE $topic SET galleries += $after.id;
		}
	};
};

DEFINE TABLE OVERWRITE feed AS
SELECT id, id AS sourceId, time,
	fn::calculate_score(votes.positive, votes.misleading, votes.negative, visits) AS score,
	user, topics
FROM post, thread, gallery
WHERE IF id IS NONE THEN false ELSE (
	(record::tb(id) = 'post' AND archived != true)
	OR (record::tb(id) = 'thread' AND replyTo = NONE)
	OR (record::tb(id) = 'gallery' AND archived != true)
) END;
DEFINE FIELD OVERWRITE hot ON feed
	COMPUTED fn::sort_hot(score, time, time::now());

UPSERT migration SET version = '2026.6.0', time = time::now()
WHERE version = '2026.6.0';
COMMIT;