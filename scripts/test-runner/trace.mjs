import { basename } from "node:path"
import yauzl from "yauzl"

export async function inspectPlaywrightTrace(archivePath) {
    const archiveEntries = await readTraceEntries(archivePath)
    const traceFiles = [...archiveEntries]
        .filter(([name]) => name.endsWith(".trace"))
        .map(([name, contents]) => ({ name, events: parseTraceEvents(name, contents) }))
    const networkFiles = [...archiveEntries]
        .filter(([name]) => name.endsWith(".network"))
        .map(([name, contents]) => ({ name, events: parseTraceEvents(name, contents) }))

    if (traceFiles.length === 0) {
        throw new Error(`No Playwright trace event files were found in ${basename(archivePath)}.`)
    }

    const events = traceFiles.flatMap(file => file.events)
    const requests = networkFiles.flatMap(file => file.events)
        .filter(event => event.type === "resource-snapshot")
        .map(event => getRequestSummary(event.snapshot))
        .filter(request => request.isApi || request.failure)
        .sort((left, right) => left.startedAt.localeCompare(right.startedAt))
    const failures = events
        .filter(event => event.type === "error" && event.message)
        .map(event => ({ message: stripAnsi(event.message), stack: formatStack(event.stack) }))
    const consoleErrors = events
        .filter(event => event.type === "console" && ["error", "warning"].includes(event.messageType))
        .map(event => ({ type: event.messageType, message: stripAnsi(event.text ?? event.message ?? "") }))
    const actions = collectActions(traceFiles)

    return {
        archive: basename(archivePath),
        traceFiles: traceFiles.map(file => file.name),
        requestCount: networkFiles.reduce(
            (total, file) => total + file.events.filter(event => event.type === "resource-snapshot").length,
            0,
        ),
        requests,
        failures,
        consoleErrors,
        actions,
    }
}

export function formatPlaywrightTraceReport(report) {
    const lines = [
        "# Playwright Trace Report",
        "",
        `Archive: \`${report.archive}\``,
        `Trace files: ${report.traceFiles.map(file => `\`${file}\``).join(", ")}`,
        `Network requests: ${report.requestCount} total; ${report.requests.length} API or failed requests`,
        "",
        "## Test Failures",
        "",
    ]

    if (report.failures.length === 0) {
        lines.push("No test failure record was found in the archive.", "")
    }
    else {
        for (const failure of report.failures) {
            lines.push("```text", failure.message, "```")
            if (failure.stack) lines.push("", "```text", failure.stack, "```")
            lines.push("")
        }
    }

    lines.push("## Browser Console", "")
    if (report.consoleErrors.length === 0) {
        lines.push("No console warnings or errors were recorded.", "")
    }
    else {
        for (const entry of report.consoleErrors) {
            lines.push(`- **${entry.type}:** ${escapeMarkdown(entry.message)}`)
        }
        lines.push("")
    }

    lines.push("## API and Failed Requests", "")
    if (report.requests.length === 0) {
        lines.push("No API requests or failed network requests were recorded.", "")
    }
    else {
        lines.push("| Time | Method | Path | Status | Duration |")
        lines.push("| --- | --- | --- | --- | ---: |")
        for (const request of report.requests) {
            const status = request.failure
                ? `Failed: ${escapeMarkdown(request.failure)}`
                : request.status ?? "No response"
            lines.push(
                `| ${escapeMarkdown(request.startedAt)} | ${escapeMarkdown(request.method)} | ${escapeMarkdown(request.path)} | ${escapeMarkdown(status)} | ${request.durationMs} ms |`,
            )
        }
        lines.push("")
    }

    lines.push("## Playwright Actions", "")
    if (report.actions.length === 0) {
        lines.push("No browser actions were recorded.", "")
    }
    else {
        lines.push("| Trace | Action | Result | Duration |")
        lines.push("| --- | --- | --- | ---: |")
        for (const action of report.actions) {
            lines.push(
                `| ${escapeMarkdown(action.trace)} | ${escapeMarkdown(action.label)} | ${escapeMarkdown(action.result)} | ${action.durationMs} ms |`,
            )
        }
        lines.push("")
    }

    return lines.join("\n")
}

function readTraceEntries(archivePath) {
    return new Promise((resolve, reject) => {
        let archive
        let settled = false
        const entries = new Map()
        const fail = (error) => {
            if (settled) return
            settled = true
            archive?.close()
            reject(error)
        }

        yauzl.open(archivePath, { lazyEntries: true, autoClose: true }, (error, openedArchive) => {
            if (error) {
                fail(error)
                return
            }

            archive = openedArchive
            archive.on("error", fail)
            archive.on("end", () => {
                if (settled) return
                settled = true
                resolve(entries)
            })
            archive.on("entry", (entry) => {
                if (!entry.fileName.endsWith(".trace") && !entry.fileName.endsWith(".network")) {
                    archive.readEntry()
                    return
                }

                archive.openReadStream(entry, (streamError, stream) => {
                    if (streamError) {
                        fail(streamError)
                        return
                    }

                    const chunks = []
                    stream.on("data", chunk => chunks.push(chunk))
                    stream.on("error", fail)
                    stream.on("end", () => {
                        entries.set(entry.fileName, Buffer.concat(chunks).toString("utf8"))
                        archive.readEntry()
                    })
                })
            })
            archive.readEntry()
        })
    })
}

function parseTraceEvents(fileName, contents) {
    return contents.split(/\r?\n/).flatMap((line, index) => {
        if (!line.trim()) return []
        try {
            return [JSON.parse(line)]
        }
        catch (error) {
            throw new Error(`Invalid Playwright trace record in ${fileName} at line ${index + 1}.`, { cause: error })
        }
    })
}

function getRequestSummary(snapshot = {}) {
    const request = snapshot.request ?? {}
    let path = request.url ?? "Unknown URL"
    try {
        path = new URL(path).pathname
    }
    catch {
        path = "Invalid URL"
    }

    const failure = request.failure?.errorText ?? snapshot.failure?.errorText
    return {
        startedAt: snapshot.startedDateTime ?? "",
        method: request.method ?? "Unknown",
        path,
        status: snapshot.response?.status,
        durationMs: Math.round(snapshot.time ?? 0),
        failure,
        isApi: path.startsWith("/api/"),
    }
}

function collectActions(traceFiles) {
    const actions = []
    const ignoredMethods = new Set(["fixture", "hook", "pw:api", "step"])

    for (const file of traceFiles) {
        const calls = new Map()
        for (const event of file.events) {
            if (event.type === "before" && event.callId) {
                calls.set(event.callId, { before: event })
            }
            else if (event.type === "after" && event.callId) {
                const call = calls.get(event.callId)
                if (call) call.after = event
            }
        }

        for (const { before, after } of calls.values()) {
            if (ignoredMethods.has(before.method) || before.class === "Route") continue
            const params = before.params ?? {}
            const detail = params.selector ?? params.locator ?? params.url
            const label = before.title ?? `${before.class ?? "Playwright"}.${before.method}`
            const error = after?.error?.message ?? after?.error
            actions.push({
                trace: file.name,
                startTime: before.startTime ?? 0,
                label: detail ? `${label}: ${safeActionDetail(detail)}` : label,
                result: error ? `Failed: ${stripAnsi(String(error))}` : "Completed",
                durationMs: Math.max(0, Math.round((after?.endTime ?? before.startTime ?? 0) - (before.startTime ?? 0))),
            })
        }
    }

    return actions.sort((left, right) => left.startTime - right.startTime)
}

function safeActionDetail(detail) {
    if (typeof detail !== "string") return JSON.stringify(detail)
    try {
        return new URL(detail).pathname
    }
    catch {
        return detail
    }
}

function formatStack(stack) {
    if (!Array.isArray(stack)) return ""
    return stack.map(frame => {
        const location = frame.file
            ? `${frame.file}${frame.line ? `:${frame.line}` : ""}${frame.column ? `:${frame.column}` : ""}`
            : ""
        return [frame.function, location].filter(Boolean).join(" ")
    }).join("\n")
}

function stripAnsi(value) {
    return value.replace(/\u001b\[[0-9;]*m/g, "")
}

function escapeMarkdown(value) {
    return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>")
}
