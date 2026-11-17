import type { Topic } from "@@/shared/types"

export class TopicManager {
    static async list() {
        return await new DatabaseQuery()
            .addSql(`
                SELECT *
                FROM topic
                ORDER BY score DESC
            `)
            .queryAll<Topic>()
    }
}
