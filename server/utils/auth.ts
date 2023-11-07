import Surreal from 'surrealdb.js';
import { H3Event } from "h3"
import type { DatabaseResponse } from '~/server/utils/database'
import type { User } from '~/types';

export const authenticateRequest = async (event: H3Event) => {
    const { surreal } = useRuntimeConfig()
    const auth = new Surreal(surreal.url)
    try {
        const token = getHeader(event, 'Authorization') ?? ""
        await auth.authenticate(token.split(' ')[1])
    }
    catch (ex) {
        throw createError({
            statusCode: 401,
            message: "Failed to authenticate request."
        })
    }
    let response = await auth.query("SELECT * FROM $auth") as unknown as DatabaseResponse<User>[]
    let user = response[0].result[0]
    if (user == null) {
        throw createError({
            statusCode: 500,
            message: "User did not exist with provided credentials."
        })
    }
    return user
}