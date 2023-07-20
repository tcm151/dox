import { Topic } from "~/types";
import { queryOne } from "../../../utils/database";

export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!;
    return await queryOne<Topic>([`
        SELECT *
        FROM topic:${topic}
    `])
})