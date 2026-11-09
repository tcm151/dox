import { vi } from "vitest"

export type DatabaseQueryCall = {
    sql: string
    parameters: Record<string, unknown>
    transaction: boolean
}

type DatabaseQueryHandlers = {
    queryOne?: (query: DatabaseQueryCall) => unknown | Promise<unknown>
    queryAll?: (query: DatabaseQueryCall) => unknown[] | Promise<unknown[]>
    queryValue?: (query: DatabaseQueryCall) => unknown | Promise<unknown>
    execute?: (query: DatabaseQueryCall) => unknown | Promise<unknown>
}

export function stubDatabaseQuery(handlers: DatabaseQueryHandlers = {}) {
    const calls: DatabaseQueryCall[] = []

    class TestDatabaseQuery {
        private statements: string[] = []
        private parameters: Record<string, unknown> = {}
        private transaction = false

        addSql(sql: string) {
            this.statements.push(sql)
            return this
        }

        addTransaction() {
            this.transaction = true
            return this
        }

        addRecord(key: string, record: string, _optional = false) {
            this.parameters[key] = record
            return this
        }

        addRecords(key: string, records: string[]) {
            this.parameters[key] = records
            return this
        }

        addParameter(key: string, value: unknown) {
            this.parameters[key] = value
            return this
        }

        async queryOne<T>() {
            const handler = handlers.queryOne
            if (!handler) throw new Error("No queryOne handler configured for the DatabaseQuery stub.")
            return await handler(this.recordCall()) as T
        }

        async queryAll<T>() {
            const handler = handlers.queryAll
            if (!handler) throw new Error("No queryAll handler configured for the DatabaseQuery stub.")
            return await handler(this.recordCall()) as T[]
        }

        async queryValue<T>() {
            const handler = handlers.queryValue
            if (!handler) throw new Error("No queryValue handler configured for the DatabaseQuery stub.")
            return await handler(this.recordCall()) as T
        }

        async execute<T>() {
            const result = await handlers.execute?.(this.recordCall())
            return (result ?? []) as T[][]
        }

        private recordCall(): DatabaseQueryCall {
            const call = {
                sql: this.statements.join("\n"),
                parameters: { ...this.parameters },
                transaction: this.transaction,
            }
            calls.push(call)
            return call
        }
    }

    vi.stubGlobal("DatabaseQuery", TestDatabaseQuery)
    return calls
}
