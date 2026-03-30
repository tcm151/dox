import type { User, Account } from "@@/shared/types"

export class UserManager {
    static async create(email: string, name: string, password: string): Promise<{ user: User, account: Account }> {
        
        new Validator("User")
            .match(email, "user.email")
            .match(name, "user.name")
            .match(password, "user.password")
            .confirm()
        
        return await new DatabaseQuery()
            .addSql(`
                RETURN {
                    LET $user = (
                        CREATE ONLY user SET
                            name = $name
                    );
    
                    let $account = (
                        CREATE ONLY account SET
                            user = $user.id,
                            email = $email,
                            password = crypto::argon2::generate($password);
                    );

                    RETURN {
                        user: $user,
                        account: $account
                    };
                }
            `)
            .addParameter("email", email)
            .addParameter("name", name)
            .addParameter("password", password)
            .queryOne<{ user: User, account: Account }>()
    }
}