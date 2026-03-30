import { createRemoteEngines, Surreal, RecordId } from 'surrealdb'
import { createNodeEngines } from '@surrealdb/node';

const config = useRuntimeConfig()
let SurrealInstance: Surreal | undefined

export async function shutdownDatabase() {
    return await SurrealInstance?.close()
}

async function initializeDatabase() {
    if (SurrealInstance && SurrealInstance.status != "disconnected") {
        return Promise.resolve(SurrealInstance)
    }
    if (config.surreal.info.type == "remote") {
        if (config.surreal.info.url == "" || !config.surreal.info.url.includes("/rpc")) {
            throw createError({
                status: 500,
                statusText: `Database URL was [${config.surreal.info.url ?? "empty"}]. Check environment variables.`
            })
        }
        SurrealInstance = new Surreal();
        console.log("Connecting to remote instance...")
        await SurrealInstance.connect(config.surreal.info.url, {
            namespace: config.surreal.info.namespace,
            database: config.surreal.info.database,
            authentication: {
                username: config.surreal.info.username,
                password: config.surreal.info.password,
            }
        })
        await SurrealInstance.ready
        console.log(`Connected to ${config.surreal.info.namespace}:${config.surreal.info.database} @ ${config.surreal.info.url}`)
        return SurrealInstance
    }
    else if (config.surreal.info.type == "embedded") {
        console.log("Starting embedded instance...")
        SurrealInstance = new Surreal({
            engines: {
                ...createRemoteEngines(),
                ...createNodeEngines(),
            },
        });
        console.log("Connecting to embedded instance...")
        await SurrealInstance.connect(config.surreal.info.url, {
            namespace: config.surreal.info.namespace,
            database: config.surreal.info.database,
        })
        await SurrealInstance.ready
        console.log(`Connected to ${config.surreal.info.namespace}:${config.surreal.info.database} @ ${config.surreal.info.url}`)
        return SurrealInstance
    }
    else {
        throw createError({
            status: 500,
            statusText: `Database type was [${config.surreal.info.type ?? "empty"}].`
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

    addRecord(key: string, record: string, optional: boolean = false) {
        try {
            this.#parameters[key] = this.parseRecord(record)
        }
        catch (error: any) {
            if (!optional) {
                throw error
            }
            this.#parameters[key] = null
        }
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
            return await connection.query(this.#sql.join("\n"), this.#parameters).collect()
        }
        catch (error: any) {
            throw createError({
                status: 500,
                statusText: "Failed to execute query.",
                message: error.message,
                stack: error.stack,
            })
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