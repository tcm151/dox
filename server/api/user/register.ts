import Surreal from "surrealdb.js";

export default defineEventHandler(async (event) => {
    const { email, username, password } = await readBody(event)
    
    const { surrealDatabaseUrl } = useRuntimeConfig();
    const db = new Surreal(surrealDatabaseUrl);
    return await db.signup({
        NS: "dev",
        DB: "dox",
        SC: "account",
        email: email,
        username: username,
        password: password,
        votes: {
            positive: [],
            misleading: [],
            negative: [],
        },
        topics: ["Admin"],
        followers: [],
        following: [],
    })
})
