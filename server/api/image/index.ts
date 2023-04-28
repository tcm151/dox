import { Image } from "~/types";
import { queryAll } from "../../database";

export default defineEventHandler(async (event) => {
    return await queryAll<Image>([`
        SELECT *
        FROM image
        ORDER BY time DESC
    `])
})