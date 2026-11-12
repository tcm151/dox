import { relative } from "node:path"

const maxFailureDetailLines = 24
const maxFailureDetailLineLength = 1200

function appendDiagnosticLines(lines, sourceLines, indentation = "    ") {
    const detailLines = sourceLines.filter(line => line.trim())
    for (const detailLine of detailLines.slice(0, maxFailureDetailLines)) {
        const line = detailLine.trim()
        const displayedLine = line.length > maxFailureDetailLineLength
            ? `${line.slice(0, maxFailureDetailLineLength)} ... [line truncated]`
            : line
        lines.push(`${indentation}${displayedLine}`)
    }

    if (detailLines.length > maxFailureDetailLines) {
        lines.push(`${indentation}... ${detailLines.length - maxFailureDetailLines} additional detail lines omitted`)
    }
}

export function formatFailureDetails(report, projectRoot = process.cwd()) {
    const failedFiles = report?.testResults?.filter(result => result.status === "failed") ?? []
    if (failedFiles.length === 0) return ""

    const rootPath = projectRoot.replaceAll("\\", "/").replace(/\/$/, "")
    const lines = ["--- Failed tests ---"]
    for (const file of failedFiles) {
        const filePath = relative(projectRoot, file.name).replaceAll("\\", "/")
        lines.push(`\n${filePath}`)
        const failedAssertions = file.assertionResults?.filter(result => result.status === "failed") ?? []
        if (failedAssertions.length === 0) {
            appendDiagnosticLines(lines, (file.message || "Test file failed before an assertion completed.").split(/\r?\n/), "  ")
            continue
        }

        for (const assertion of failedAssertions) {
            lines.push(`  FAIL ${assertion.fullName || assertion.title}`)
            for (const message of assertion.failureMessages ?? []) {
                const messageLines = message.split(/\r?\n/)
                const stackStart = messageLines.findIndex(line => /^\s+at /.test(line))
                const details = stackStart < 0 ? messageLines : messageLines.slice(0, stackStart)
                appendDiagnosticLines(lines, details)

                if (assertion.location) {
                    lines.push(`    at ${filePath}:${assertion.location.line}:${assertion.location.column}`)
                }

                const projectFrames = messageLines
                    .filter(line => /^\s+at /.test(line))
                    .map(line => line.trim().replaceAll("\\", "/"))
                    .filter(line => line.includes(`${rootPath}/`) && !line.includes("/node_modules/"))
                    .map(line => {
                        const rootIndex = line.indexOf(`${rootPath}/`)
                        return `${line.slice(0, rootIndex)}${line.slice(rootIndex + rootPath.length + 1)}`
                    })
                    .filter(frame => !assertion.location || !frame.includes(`${filePath}:${assertion.location.line}:${assertion.location.column}`))
                    .slice(0, 3)
                for (const frame of projectFrames) {
                    lines.push(`    ${frame}`)
                }
            }
        }
    }

    return lines.join("\n")
}