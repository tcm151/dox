export class UserManager {
    static async create(email: string, name: string, password: string): Promise<User> {
        
        new Validator("User")
            .add(email, "user.email")
            .add(name, "user.name")
            .add(password, "user.pasword")
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