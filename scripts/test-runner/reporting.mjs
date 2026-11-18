import { relative } from "node:path"
import { performance } from "node:perf_hooks"

const slowFileThresholdMs = 10_000

function appendDiagnosticLines(lines, sourceLines, indentation = "    ") {
    for (const detailLine of sourceLines.filter(line => line.trim())) {
        lines.push(`${indentation}${detailLine.trim()}`)
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
                for (const frame of projectFrames) {
                    lines.push(`    ${frame}`)
                }
            }
        }
    }

    return lines.join("\n")
}

export function formatVitestFailureOutput(output) {
    const outputLines = output.split(/\r?\n/)
    const failureHeadingIndex = outputLines.findIndex(line => line.includes("Failed Tests"))
    if (failureHeadingIndex < 0) return ""

    const failureEndIndex = outputLines.findIndex((line, index) =>
        index > failureHeadingIndex && line.trim().startsWith("⎯") && /\[\d+\/\d+\]/.test(line),
    )

    return outputLines
        .slice(failureHeadingIndex + 1, failureEndIndex < 0 ? undefined : failureEndIndex)
        .join("\n")
        .trim()
}

export function reportVitestFailure(result, testPath, phaseName, projectRoot = process.cwd()) {
    const vitestOutput = [result.stdout, result.stderr].filter(Boolean).join("\n").trim()
    const vitestFailureDetails = formatVitestFailureOutput(vitestOutput)
    if (vitestFailureDetails) {
        process.stderr.write(`\n--- Vitest failure: ${phaseName} (${testPath}) ---\n${vitestFailureDetails}\n`)
        return result.exitCode
    }

    const failureDetails = formatFailureDetails(result.report, projectRoot)
    if (failureDetails) {
        process.stderr.write(`\n${failureDetails}\n`)
    }
    else if (vitestOutput) {
        process.stderr.write(`\n--- Vitest failure output: ${phaseName} (${testPath}) ---\n${vitestOutput}\n`)
    }
    return result.exitCode
}

export function createTestReporter() {
    const timings = []
    const runStartedAt = performance.now()
    let buildWasCached = false

    function recordDuration(label, durationMs) {
        timings.push({ label, durationMs })
    }

    return {
        setBuildWasCached(cached) {
            buildWasCached = cached
        },
        recordTiming(label, startedAt) {
            recordDuration(label, performance.now() - startedAt)
        },
        recordDuration,
        recordBrowserFileTimings(summary) {
            if (!summary) return
            for (const { file, durationMs } of summary.files) {
                recordDuration(`browser file ${file} test time`, durationMs)
            }
        },
        printTestSummary(testSummaries) {
            const passedTests = testSummaries.reduce((total, summary) => total + summary.passedTests, 0)
            const totalTests = testSummaries.reduce((total, summary) => total + summary.totalTests, 0)
            console.log(`\n[tests] ${passedTests}/${totalTests} tests passed`)
            return 0
        },
        printTimingSummary({ selectedTestPath, browserMode }) {
            const durationFor = predicate => timings
                .filter(({ label }) => predicate(label))
                .reduce((total, { durationMs }) => total + durationMs, 0)
            const appStartupDuration = durationFor(label => label === "app startup")
            const setupDuration = durationFor(label => label === "required fixtures" || label === "sequential tests")
            const serverTestDuration = durationFor(label => label === "parallel server tests")
            const browserDuration = durationFor(label => label === "browser suite" || label.startsWith("browser test "))
            const cleanupDuration = durationFor(label => label === "cleanup")
            const summary = [
                `total ${formatDuration(performance.now() - runStartedAt)}`,
                `startup ${formatDuration(appStartupDuration)}${buildWasCached ? " (cached)" : ""}`,
                `${selectedTestPath || browserMode ? "fixtures" : "sequential"} ${formatDuration(setupDuration)}`,
            ]
            if (serverTestDuration > 0) summary.push(`server tests ${formatDuration(serverTestDuration)}`)
            if (browserDuration > 0) summary.push(`browser ${formatDuration(browserDuration)}`)
            summary.push(`cleanup ${formatDuration(cleanupDuration)}`)
            console.log(`\n[test timing] ${summary.join(" | ")}`)

            const slowFiles = timings
                .filter(({ label, durationMs }) => label.startsWith("browser file ") && durationMs >= slowFileThresholdMs)
                .sort((left, right) => right.durationMs - left.durationMs)
                .slice(0, 5)
            if (slowFiles.length > 0) {
                const details = slowFiles.map(({ label, durationMs }) => `${label.replaceAll("\\", "/")}: ${formatDuration(durationMs)}`)
                console.log(`[slow files >= ${formatDuration(slowFileThresholdMs)}] ${details.join(" | ")}`)
            }
        },
    }
}

function formatDuration(durationMs) {
    return `${(durationMs / 1000).toFixed(1)}s`
}