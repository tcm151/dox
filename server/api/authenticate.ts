import { User } from "~/types/types";
import { queryOne } from "../database";

export default defineEventHandler(async (event) => {
    try {
        return await queryOne<User>([
            `SELECT id, name `,
            `FROM user`,
            `WHERE id = $auth.id`,
        ])
    }
    catch (ex) {
        console.log(ex)
        return {
            success: false,
            user: null,
        }
    }
})