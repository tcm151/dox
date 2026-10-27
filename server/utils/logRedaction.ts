const sensitiveKeyPattern = /password|passwd|passphrase|secret|token|authorization|cookie|api[-_]?key|access[-_]?key|private[-_]?key|credential/i
const sensitiveQueryPattern = /([?&][^=&#\s]*(?:password|passwd|passphrase|secret|token|authorization|cookie|api[-_]?key|access[-_]?key|private[-_]?key|credential)[^=&#\s]*=)[^&#\s]*/gi
const bearerPattern = /\b(Bearer)\s+[^\s,;]+/gi
const basicPattern = /\b(Basic)\s+[A-Za-z0-9+/]+=*/gi

export function redactLogText(value: string): string {
    return value
        .replace(bearerPattern, "$1 [REDACTED]")
        .replace(basicPattern, "$1 [REDACTED]")
        .replace(sensitiveQueryPattern, "$1[REDACTED]")
}

export function redactLogData(value: unknown): Record<string, unknown> {
    const redacted = redactLogValue(value)
    if (redacted && typeof redacted === "object" && !Array.isArray(redacted)) {
        return redacted as Record<string, unknown>
    }

    return { value: redacted }
}

function redactLogValue(value: unknown): unknown {
    if (typeof value === "string") return redactLogText(value)
    if (Array.isArray(value)) return value.map(redactLogValue)
    if (!value || typeof value !== "object") return value

    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) return redactLogText(String(value))

    return Object.fromEntries(
        Object.entries(value).map(([key, nested]) => [
            key,
            sensitiveKeyPattern.test(key) ? "[REDACTED]" : redactLogValue(nested),
        ]),
    )
}
