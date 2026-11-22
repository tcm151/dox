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

UPSERT migration SET version = '2026.6.6', time = time::now()
WHERE version = '2026.6.6';
COMMIT;