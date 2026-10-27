import { createRemoteEngines, Surreal, RecordId } from 'surrealdb'
import { createNodeEngines } from '@surrealdb/node';

const config = useRuntimeConfig()
let SurrealInstance: Surreal | undefined

function normalizeRecordIds<T>(value: T): T {
    if (value instanceof RecordId) {
        return `${value.table.name}:${value.id}` as T
    }
    if (Array.isArray(value)) {
        return value.map(normalizeRecordIds) as T
    }
    if (value && typeof value === "object") {
        const prototype = Object.getPrototypeOf(value)
        if (prototype === Object.prototype || prototype === null) {
            return Object.fromEntries(
                Object.entries(value).map(([key, nested]) => [key, normalizeRecordIds(nested)])
            ) as T
        }
    }
    return value
}

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
    #transaction = false

    /**
     * @param connection Optional existing connection; defaults to the shared database connection.
     */
    constructor(connection?: Surreal) {
        this.#connection = connection ?? SurrealInstance
    }

    private parseRecord(record: string) {
        const parsed = parseRecordId(record)
        if (!parsed) {
            throw createError({
                status: 400,
                statusText: "Invalid record ID."
            })
        }
        return new RecordId(parsed.table, parsed.id)
    }

    /**
     * Adds SQL to the query in execution order.
     * @param sql SQL statement or statement block to append.
     */
    addSql(sql: string) {
        const trimmed = sql.split("\n").map(line => line.trim()).join("\n")
        this.#sql.push(trimmed)
        return this
    }

    /** Wraps the composed SQL in a transaction and retries transaction conflicts. */
    addTransaction() {
        this.#transaction = true
        return this
    }

    /**
     * Binds a record ID as a SurrealDB record; use for record-valued fields and parameters.
     * @param key Parameter name referenced by the SQL.
     * @param record Record ID in `table:id` form.
     * @param optional When true, invalid record IDs bind as null instead of throwing.
     */
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

    /**
     * Binds an array of record IDs as SurrealDB records.
     * @param key Parameter name referenced by the SQL.
     * @param records Record IDs in `table:id` form.
     */
    addRecords(key: string, records: string[]) {
        let results: RecordId[] = []
        for (let record of records) {
            results.push(this.parseRecord(record))
        }
        this.#parameters[key] = results
        return this
    }

    /**
     * Binds a regular value; use addRecord or addRecords for record IDs.
     * @param key Parameter name referenced by the SQL.
     * @param value Value to bind.
     */
    addParameter(key: string, value: any) {
        this.#parameters[key] = value
        return this
    }

    /** Executes the query and returns each statement's rows, normalizing record IDs. */
    async execute<T>(): Promise<T[][]> {
        try {
            const connection = this.#connection ?? await initializeDatabase()
            await connection.ready
            const sql = this.#sql.join("\n")
            const query = this.#transaction ? `RETURN { ${sql} };` : sql
            const maxAttempts = this.#transaction ? 3 : 1

            let responses: T[][] | undefined
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                try {
                    responses = await connection.query(query, this.#parameters).collect() as T[][]
                    break
                }
                catch (error) {
                    const isFinalAttempt = attempt === maxAttempts - 1
                    const isConflict = error instanceof Error && error.message.includes("Transaction conflict:")
                    if (!this.#transaction || !isConflict || isFinalAttempt) {
                        throw error
                    }
                }
            }

            if (!responses) {
                throw new Error("Database query did not return a response.")
            }
            return normalizeRecordIds(responses)
        }
        catch (error: any) {
            const applicationError = error.kind === "Thrown" && typeof error.message === "string"
                ? /^An error occurred: APP_ERROR:(\d{3}):([\s\S]*)$/.exec(error.message)
                : null

            const applicationStatusCode = Number(applicationError?.[1])
            if (applicationError && applicationStatusCode >= 400 && applicationStatusCode <= 599) {
                throw createError({
                    statusCode: applicationStatusCode,
                    statusMessage: applicationError[2],
                    message: applicationError[2],
                    stack: error.stack,
                })
            }

            throw createError({
                status: 500,
                statusText: "Failed to execute query.",
                message: error.message,
                stack: error.stack,
            })
        }
    }

    /** Returns the first row from the first statement, or throws 404 if no row was returned. */
    async queryOne<T>(): Promise<T> {
        let responses = await this.execute<T>()
        if (responses[0] == undefined || responses[0][0] == undefined) {
            throw createError({
                status: 404,
                statusText: "This queryOne returns nothing.",
            })
        }
        return responses[0][0]
    }

    /** Returns all rows from the first statement; an empty row set remains an empty array. */
    async queryAll<T>(): Promise<T[]> {
        let responses = await this.execute<T>()
        if (responses[0] == undefined) {
            throw createError({
                status: 404,
                statusText: "This queryAll returns nothing.",
            })
        }
        return responses[0]
    }

    /** Returns a scalar or structured value returned by the query without unwrapping it as a row. */
    async queryValue<T>(): Promise<T> {
        let responses = await this.execute<T>()
        if (responses[0] == undefined) {
            throw createError({
                status: 404,
                statusText: "This queryValue returns nothing.",
            })
        }
        return responses[0] as T
    }
}