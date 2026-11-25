import type { User } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const user = await readBody<Pick<User, "name" | "link" | "description">>(event)

    // TODO allow the username cooldown to be configurable in the appSettings
    return await new DatabaseQuery()
        .addSql(`
            UPDATE $user SET
                link = $link,
                description = $description;

            IF $name != $user.name {
                LET $lastChanged = (
                    SELECT VALUE time
                    FROM ONLY moderatorLog
                    WHERE target = $user
                    AND action = "username.change"
                    ORDER BY time DESC
                    LIMIT 1
                );
                IF $lastChanged != NONE AND time::now() - $lastChanged < 30d {
                    LET $cooldown = duration::days(30d - (time::now() - $lastChanged));
                    fn::http(409, string::concat("You must wait ", $cooldown, " days before changing your username."));
                };
                
                CREATE moderatorLog SET
                    actor = $user,
                    action = "username.change",
                    target = $user,
                    details = { name: { before: $user.name, after: $name } };
                
                UPDATE $user SET
                    name = $name;
            }
        `)
        .addTransaction()
        .addRecord("user", auth.id)
        .addParameter("name", user.name)
        .addParameter("link", user.link)
        .addParameter("description", user.description)
        .execute()
})