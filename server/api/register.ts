import { User } from "~/types/types"
import { useDatabase } from "../database"

export default defineEventHandler(async (event) => {
    const { email, username, password } = await readBody(event)
    
    const db = await useDatabase()
    await db.signup({
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
