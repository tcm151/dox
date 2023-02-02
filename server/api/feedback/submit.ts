import { useDatabase } from "~~/server/database";


export default defineEventHandler(async (event) => {
    const feedback = await readBody(event);
    const db = await useDatabase();
    return await db.create("feedback", feedback);
})