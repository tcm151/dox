import { useDatabase } from "../../database";

export default defineEventHandler(async (event) => {
    const post = await readBody(event);
    const db = await useDatabase();
    return (await db.create("comment", post));
})