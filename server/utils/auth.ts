import Surreal from 'surrealdb.js';
import { H3Event } from "h3"
import type { User } from '~/types';

export const authenticateRequest = async (event: H3Event) => {
    const { surreal } = useRuntimeConfig()
    const auth = new Surreal()
    try {
        const token = getHeader(event, 'Authorization') ?? ""
        await auth.connect(surreal.url, {
            auth: token
        })
        
        let user = await auth.info() as unknown as User
    
        await auth.close()
        return user
    }
    catch (ex) {
        throw createError({
            statusCode: 401,
            message: "Failed to authenticate request."
        })
    }
}