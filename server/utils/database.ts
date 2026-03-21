import { Surreal, createRemoteEngines, RecordId, BoundQuery } from 'surrealdb'
import { createNodeEngines } from '@surrealdb/node';

const config = useRuntimeConfig()
// if (config.surreal.url == "" || !config.surreal.url.includes("/rpc")) {
//     throw createError({
//         statusCode: 500,
//         statusMessage: `Database URL was [${config.surreal.url ?? "empty"}]. Check environment variables.`
//     })
// }

export let SurrealInstance: Surreal

(async () => {
    if (config.surreal.type == "remote") {
        SurrealInstance = new Surreal();
        openConnection(SurrealInstance)
    }
    else if (config.surreal.type == "embedded") {
        SurrealInstance = new Surreal({
            engines: {
                ...createRemoteEngines(),
                ...createNodeEngines(),
            },
        });
        openConnection(SurrealInstance)
    }
})()

async function openConnection(instance: Surreal) {
    await instance.connect(config.surreal.url, {
        namespace: config.surreal.namespace,
        database: config.surreal.database,
        authentication: {
            username: config.surreal.username,
            password: config.surreal.password,
        }
    })

    await instance.ready
    console.log(`Connected to ${config.surreal.namespace}:${config.surreal.database} @ ${config.surreal.url                                                                                    }`)
}

export class DatabaseQuery {
    #sql: string[] = []
    #parameters: { [key: string]: any } = { }
    #connection: Surreal = SurrealInstance

    constructor(connection?: Surreal) {
        if (connection) {
            this.#connection = connection
        }
    }

    private parseRecord(record: string) {
        const [table, id] = record.toString().split(":", 2)
        if (!table || !id) {
            throw createError({
                status: 400,
                statusText: "Invalid record ID."
            })
        }
        return new RecordId(table, id)
    }

    addSql(sql: string) {
        this.#sql.push(sql)
        return this
    }

    addRecord(key: string, record: string) {
        this.#parameters[key] = this.parseRecord(record)
        return this
    }

    addRecords(key: string, records: string[]) {
        let results: RecordId[] = []
        for (let record of records) {
            results.push(this.parseRecord(record))
        }
        this.#parameters[key] = results
        return this
    }

    addParameter(key: string, value: any) {
        this.#parameters[key] = value
        return this
    }

    async execute<T>(): Promise<T[][]> {
        try {
            let query = new BoundQuery<T[][]>(this.#sql.join("\n"), this.#parameters)
            return await this.#connection.query(query)
        }
        catch (ex: any) {
            if (ex.message.startsWith("Surreal Error:")) {
                const message = ex.message.split(":").at(1).trim()
                throw createError({
                    statusCode: 500,
                    statusMessage: message,
                })
            }
            else {
                console.log(ex)
                throw createError({
                    statusCode: 500,
                    statusMessage: `Server Error: Oops.`,
                    message: ex.message
                })
            }
        }
    }

    async queryOne<T>(): Promise<T> {
        let responses = await this.execute<T>()
        if (!responses[0] || !responses[0][0]) {
            throw createError({
                statusCode: 404,
                statusMessage: "This query returns nothing."
            })
        }
        return responses[0][0]
    }

    async queryAll<T>(): Promise<T[]> {
        let responses = await this.execute<T>()
        if (!responses[0]) {
            throw createError({
                status: 404,
                statusText: "This query returns nothing."
            })
        }
        return responses[0]
    }
}