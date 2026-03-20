import { Surreal, RecordId, BoundQuery } from 'surrealdb'

const { surreal } = useRuntimeConfig()
if (surreal.url == "" || !surreal.url.includes("/rpc")) {
    throw createError({
        statusCode: 500,
        statusMessage: `Database URL was [${surreal.url ?? "empty"}]. Check environment variables.`
    })
}

const serverInstance = new Surreal();
(async () => {
    return await serverInstance.connect(surreal.url, {
        namespace: surreal.namespace,
        database: surreal.database,
        authentication: {
            username: surreal.username,
            password: surreal.password,
        }
    })
})()

interface Parameters {
    [key: string]: any
}

export interface DatabaseResponse<T> {
    status: string
    detail?: string
    time: string
    result: T[]
}

interface Query {
    sql: string[]
    parameters?: Parameters
    label?: string
}

export function queryBuilder(): { sql: string[], parameters: Parameters } {
    return {
        sql: [],
        parameters: {},
    }
}

async function handleQuery<T>(query: Query) {
    try {
        return await serverInstance.query(query.sql.join("\n"), query.parameters ?? {}) as T[][]
    }
    catch (ex: any) {
        if (ex.message.startsWith("An error occurred:")) {
            const message = ex.message.split(":").at(1).trim()
            throw createError({
                fatal: true,
                statusCode: 500,
                statusMessage: message,
            })
        }
        else {
            throw createError({
                fatal: true,
                statusCode: 500,
                statusMessage: `API Error: ${query.label ?? "Unable to execute query."}`,
                message: ex.message
            })
        }
    }
}

export async function queryOne<T>(query: Query): Promise<T> {
    let responses = await handleQuery<T>(query)
    return responses[0]![0]!
}

export async function queryAll<T>(query: Query): Promise<T[]> {
    let response = await handleQuery<T>(query) 
    return response[0]!
}

export async function complexQuery(query: Query): Promise<unknown[][]> {
    const responses = await handleQuery(query)
    // maybe do something before just returning things
    return responses
}

// TODO planned migration to this class for better readability and maintainability.
// Should be used in all future database interactions.
export class DatabaseQuery {
    #sql: string[] = []
    #parameters: Parameters = {}
    #connection: Surreal = serverInstance

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