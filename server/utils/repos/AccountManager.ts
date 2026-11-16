export class AccountManager {
    static async deleteAccount(userId: string, password: string, confirmation: string): Promise<void> {
        await new DatabaseQuery()
            .addSql(`
                LET $deleted = user:deleted;
                LET $account = (SELECT * FROM ONLY account WHERE user = $user LIMIT 1);
                IF $user = $deleted OR $account = NONE {
                    fn::http(404, "Account not found.");
                };
                IF $confirmation != $user.name {
                    fn::http(400, "The confirmation does not match your username.");
                };
                IF !crypto::argon2::compare($account.password, $password) {
                    fn::http(403, "The current password is incorrect.");
                };

                DELETE draft WHERE user = $user;
                UPDATE post SET user = $deleted WHERE user = $user;
                UPDATE comment SET user = $deleted WHERE user = $user;
                UPDATE thread SET user = $deleted WHERE user = $user;
                UPDATE gallery SET user = $deleted WHERE user = $user;
                UPDATE image SET user = $deleted WHERE user = $user;
                UPDATE audio SET user = $deleted WHERE user = $user;

                UPDATE report SET complaints = array::map(complaints, |$entry| object::extend($entry, {
                    user: IF $entry.user = $user THEN $deleted ELSE $entry.user END
                }))
                WHERE array::any(complaints, |$entry| $entry.user = $user);
                UPDATE report SET history = array::map(history, |$entry| object::extend($entry, {
                    user: IF $entry.user = $user THEN $deleted ELSE $entry.user END
                }))
                WHERE array::any(history, |$entry| $entry.user = $user);

                UPDATE report SET moderator = $deleted WHERE moderator = $user;
                UPDATE moderatorLog SET actor = $deleted WHERE actor = $user;
                UPDATE topic SET moderators -= $user WHERE moderators CONTAINS $user;
                UPDATE userSettings SET
                    content.filters.muted = array::difference(content.filters.muted, [$user]),
                    content.filters.blocked = array::difference(content.filters.blocked, [$user])
                WHERE content.filters.muted CONTAINS $user
                    OR content.filters.blocked CONTAINS $user;
                DELETE moderationRequest WHERE user = $user;
                UPDATE pin SET user = $deleted WHERE user = $user;
                DELETE notification WHERE recipient = $user OR context = $user;
                DELETE feedback WHERE user = $user;
                DELETE developerQuery WHERE user = $user;
                DELETE error WHERE user = $user;
                DELETE accountConfirmation WHERE account = $account.id;
                DELETE passwordReset WHERE account = $account.id;
                DELETE scheduledEmail WHERE recipient = $account.email;
                DELETE session WHERE account = $account.id;
                DELETE userSettings WHERE user = $user;
                DELETE $account;
                DELETE $user;
            `)
            .addTransaction()
            .addRecord("user", userId)
            .addParameter("password", password)
            .addParameter("confirmation", confirmation)
            .execute()
    }

    static async wipeAccount(userId: string, password: string, confirmation: string): Promise<void> {
        await new DatabaseQuery()
            .addSql(`
                LET $deleted = user:deleted;
                LET $account = (SELECT * FROM ONLY account WHERE user = $user LIMIT 1);
                IF $user = $deleted OR $account = NONE {
                    fn::http(404, "Account not found.");
                };
                IF $confirmation != $user.name {
                    fn::http(400, "The confirmation does not match your username.");
                };
                IF !crypto::argon2::compare($account.password, $password) {
                    fn::http(403, "The current password is incorrect.");
                };

                DELETE draft WHERE user = $user;

                LET $comments = (SELECT VALUE id FROM comment WHERE user = $user ORDER BY time DESC);
                FOR $comment IN $comments {
                    LET $replies = (SELECT VALUE id FROM comment WHERE replyTo = $comment);
                    IF $replies.len() > 0 {
                        UPDATE $comment SET
                            user = $deleted,
                            content = "[deleted]",
                            deleted = true,
                            status = "deleted";
                    }
                    ELSE {
                        DELETE report WHERE subject = $comment;
                        DELETE $comment;
                    };
                };

                LET $threads = (SELECT VALUE id FROM thread WHERE user = $user ORDER BY time DESC);
                FOR $thread IN $threads {
                    LET $replies = (SELECT VALUE id FROM thread WHERE replyTo = $thread);
                    LET $quotes = (SELECT VALUE id FROM thread WHERE quote = $thread);
                    IF $replies.len() > 0 OR $quotes.len() > 0 {
                        UPDATE $thread SET
                            user = $deleted,
                            content = "[deleted]",
                            deleted = true,
                            status = "deleted",
                            topics = [],
                            images = [];
                    }
                    ELSE {
                        DELETE report WHERE subject = $thread;
                        DELETE $thread;
                    };
                };

                LET $posts = (SELECT VALUE id FROM post WHERE user = $user ORDER BY time DESC);
                FOR $post IN $posts {
                    LET $commentsOnPost = (SELECT VALUE id FROM comment WHERE context = $post);
                    LET $replies = (SELECT VALUE id FROM post WHERE replyTo = $post);
                    IF $commentsOnPost.len() > 0 OR $replies.len() > 0 {
                        UPDATE $post SET
                            user = $deleted,
                            title = "[deleted]",
                            content = "[deleted]",
                            deleted = true,
                            status = "deleted",
                            topics = [],
                            images = [];
                    }
                    ELSE {
                        DELETE report WHERE subject = $post;
                        DELETE $post;
                    };
                };

                LET $galleries = (SELECT VALUE id FROM gallery WHERE user = $user);
                FOR $gallery IN $galleries {
                    LET $commentsOnGallery = (SELECT VALUE id FROM comment WHERE context = $gallery);
                    IF $commentsOnGallery.len() > 0 {
                        UPDATE $gallery SET
                            user = $deleted,
                            description = "[deleted]",
                            status = "deleted",
                            topics = [],
                            images = [];
                    }
                    ELSE {
                        DELETE report WHERE subject = $gallery;
                        DELETE $gallery;
                    };
                };

                FOR $image IN (SELECT VALUE id FROM image WHERE user = $user) {
                    LET $usages = (
                        SELECT VALUE id
                        FROM post, thread, draft, gallery
                        WHERE images CONTAINS $image
                    );
                    IF $usages.len() > 0 {
                        UPDATE $image SET user = $deleted;
                    }
                    ELSE {
                        CREATE type::record("mediaTrash", $image.id) SET
                            type = "image",
                            extension = $image.type;
                        DELETE $image;
                    };
                };
                FOR $audio IN (SELECT VALUE id FROM audio WHERE user = $user) {
                    CREATE type::record("mediaTrash", $audio.id) SET
                        type = "audio",
                        extension = $audio.type;
                    DELETE $audio;
                };

                UPDATE report SET complaints = array::map(complaints, |$entry| object::extend($entry, {
                    user: IF $entry.user = $user THEN $deleted ELSE $entry.user END
                }))
                WHERE array::any(complaints, |$entry| $entry.user = $user);
                UPDATE report SET history = array::map(history, |$entry| object::extend($entry, {
                    user: IF $entry.user = $user THEN $deleted ELSE $entry.user END
                }))
                WHERE array::any(history, |$entry| $entry.user = $user);

                UPDATE report SET moderator = $deleted WHERE moderator = $user;
                UPDATE moderatorLog SET actor = $deleted WHERE actor = $user;
                UPDATE topic SET moderators -= $user WHERE moderators CONTAINS $user;
                UPDATE userSettings SET
                    content.filters.muted = array::difference(content.filters.muted, [$user]),
                    content.filters.blocked = array::difference(content.filters.blocked, [$user])
                WHERE content.filters.muted CONTAINS $user
                    OR content.filters.blocked CONTAINS $user;
                DELETE moderationRequest WHERE user = $user;
                UPDATE pin SET user = $deleted WHERE user = $user;
                DELETE notification WHERE recipient = $user OR context = $user;
                DELETE feedback WHERE user = $user;
                DELETE developerQuery WHERE user = $user;
                DELETE error WHERE user = $user;
                DELETE accountConfirmation WHERE account = $account.id;
                DELETE passwordReset WHERE account = $account.id;
                DELETE scheduledEmail WHERE recipient = $account.email;
                DELETE session WHERE account = $account.id;
                DELETE userSettings WHERE user = $user;
                DELETE $account;
                DELETE $user;
            `)
            .addTransaction()
            .addRecord("user", userId)
            .addParameter("password", password)
            .addParameter("confirmation", confirmation)
            .execute()
    }
}
