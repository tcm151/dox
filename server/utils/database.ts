import { Surreal, createRemoteEngines, RecordId, BoundQuery } from 'surrealdb'
import { createNodeEngines } from '@surrealdb/node';

const config = useRuntimeConfig()
let SurrealInstance: Surreal | undefined

async function initializeDatabase() {
    if (SurrealInstance && SurrealInstance.status != "disconnected") {
        return Promise.resolve(SurrealInstance)
    }
    if (config.surreal.type == "remote") {
        if (config.surreal.url == "" || !config.surreal.url.includes("/rpc")) {
            throw createError({
                statusCode: 500,
                statusMessage: `Database URL was [${config.surreal.url ?? "empty"}]. Check environment variables.`
            })
        }
        SurrealInstance = new Surreal();
        console.log("Connecting to remote instance...")
        await SurrealInstance.connect(config.surreal.url, {
            namespace: config.surreal.namespace,
            database: config.surreal.database,
            authentication: {
                username: config.surreal.username,
                password: config.surreal.password,
            }
        })
        await SurrealInstance.ready
        console.log(`Connected to ${config.surreal.namespace}:${config.surreal.database} @ ${config.surreal.url}`)
        return SurrealInstance
    }
    else if (config.surreal.type == "embedded") {
        console.log("Starting embedded instance...")
        SurrealInstance = new Surreal({
            engines: {
                ...createRemoteEngines(),
                ...createNodeEngines(),
            },
        });
        console.log("Connecting to embedded instance...")
        await SurrealInstance.connect(config.surreal.url, {
            namespace: config.surreal.namespace,
            database: config.surreal.database,
        })
        await SurrealInstance.ready
        console.log(`Connected to ${config.surreal.namespace}:${config.surreal.database} @ ${config.surreal.url}`)
        return SurrealInstance
    }
    else {
        throw createError({
            status: 500,
            statusText: `Database type was [${config.surreal.type ?? "empty"}].`
        })
    }
}
export class DatabaseQuery {
    #sql: string[] = []
    #parameters: Record<string, any> = { }
    #connection: Surreal | undefined

    constructor(connection?: Surreal) {
        this.#connection = connection ?? SurrealInstance
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
        const trimmed = sql.split("\n").map(line => line.trim()).join("\n")
        this.#sql.push(trimmed)
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
            const connection = this.#connection ?? await initializeDatabase()
            await connection.ready
            let query = new BoundQuery<T[][]>(this.#sql.join("\n"), this.#parameters)
            return await connection.query(query)
        }
        catch (ex: any) {
            if (ex.message.startsWith("Surreal Error:")) {
                const message = ex.message.split(":").at(1).trim()
                throw createError({
                    statusCode: 500,
                    statusMessage: message,
                    data: {
                        sql: this.#sql.join("\n"),
                        parameters: this.#parameters,
                    }
                })
            }
            else {
                console.log(ex)
                throw createError({
                    statusCode: 500,
                    statusMessage: `Server Error: Oops.`,
                    message: ex.message,
                    data: {
                        sql: this.#sql.join("\n"),
                        parameters: this.#parameters,
                    }
                })
            }
        }
    }

    async queryOne<T>(): Promise<T> {
        let responses = await this.execute<T>()
        if (!responses[0] || !responses[0][0]) {
            throw createError({
                status: 404,
                statusText: "This queryOne returns nothing.",
            })
        }
        return responses[0][0]
    }

    async queryAll<T>(): Promise<T[]> {
        let responses = await this.execute<T>()
        if (!responses[0]) {
            throw createError({
                status: 404,
                statusText: "This queryAll returns nothing.",
            })
        }
        return responses[0]
    }
}