BEGIN TRANSACTION;

// allow admins to always view user profiles
DEFINE FUNCTION OVERWRITE fn::can_view_profile($owner: record<user>, $viewer: option<record<user>>) -> bool {
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

// following a topic gives them a positive vote
UPDATE topic SET
    votes.positive = array::union(votes.positive, followers)
WHERE votes.positive != array::union(votes.positive, followers);

// following a user gives them a positive vote
UPDATE user SET
    votes.positive = array::union(votes.positive, followers)
WHERE votes.positive != array::union(votes.positive, followers);

UPSERT migration SET version = '2026.6.6', time = time::now()
WHERE version = '2026.6.6';
COMMIT;