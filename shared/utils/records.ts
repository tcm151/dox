export type ParsedRecordId = {
    table: string
    id: string
}

export function parseRecordId(value: string): ParsedRecordId | undefined {
    const match = /^(\w+):([\w-]+)$/.exec(value)
    if (!match) return undefined

    return { table: match[1], id: match[2] }
}

export function extractId(id: string) {
    return parseRecordId(id)?.id
}