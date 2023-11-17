import Surreal from 'surrealdb.js';
import { H3Event } from "h3"
import type { User } from '~/types';

export const authenticateRequest = async (event: H3Event) => {
    const { surreal } = useRuntimeConfig()
    const auth = new Surreal()
    try {
        const token = getHeader(event, 'Authorization') ?? ""
        await auth.connect(surreal.url, {
            auth: token.split(' ')[1]
        })
    }
    catch (ex) {
        throw createError({
            statusCode: 401,
            message: "Failed to authenticate request."
        })
    }
    let response = await auth.query("SELECT * FROM $auth") as unknown as User[][]
    let user = response[0][0]
    if (user == null) {
        throw createError({
            statusCode: 500,
            message: "User did not exist with provided credentials."
        })
    }
    return user
}