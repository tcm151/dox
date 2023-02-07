import { User } from "~/types/types";
import { authenticateRequest, queryOne, useDatabase } from "../database";

export default defineEventHandler(async (event) => {
    await authenticateRequest(event);
    return true;
})