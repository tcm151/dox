export class UserManager {
    static async create(email: string, name: string, password: string): Promise<User> {
        
        new Validator("User")
            .match(email, "user.email")
            .match(name, "user.name")
            .match(password, "user.password")
            .confirm()
        
        return await new DatabaseQuery()
            .addSql(`
                CREATE user SET
                    email = $email,
                    name = $name,
                    password = crypto::argon2::generate($password);
            `)
            .addParameter("email", email)
            .addParameter("name", name)
            .addParameter("password", password)
            .queryOne<User>()
    }
}