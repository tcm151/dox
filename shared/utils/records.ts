export type ParsedRecordId = {
    table: string
    id: string
}

// TODO should maybe throw here if invalid instead of undefined
export function parseRecordId(value: string): ParsedRecordId | undefined {
    const match = /^(\w+):([\w-]+)$/.exec(value)
    if (!match) return undefined

    return { table: match[1]!, id: match[2]! }
}

export function extractId(id: string | undefined) {
    return parseRecordId(id ?? "")?.id
}