import { existsSync } from "node:fs"
import { join } from "node:path"

const testUsage = "Usage: yarn test [--cleanup | --inspect <trace.zip> [--report <path>] | --keep-output] [--sequential | --server | --browser | --file <parallel-test-file>]"

export function parseTestArguments(testArguments, projectRoot) {
    const cleanupArguments = testArguments.filter(argument => argument === "--cleanup")
    const keepOutputArguments = testArguments.filter(argument => argument === "--keep-output")
    const unparsedArguments = testArguments.filter(argument => argument !== "--cleanup" && argument !== "--keep-output")
    const fileArguments = []
    const traceArguments = []
    const reportArguments = []
    const runnerArguments = []
    for (let index = 0; index < unparsedArguments.length; index++) {
        const argument = unparsedArguments[index]
        if (argument === "--file") {
            const fileArgument = unparsedArguments[index + 1]
            fileArguments.push(fileArgument && !fileArgument.startsWith("--") ? fileArgument : undefined)
            if (fileArguments[fileArguments.length - 1]) index++
        }
        else if (argument === "--inspect" || argument === "--report") {
            const nextArgument = unparsedArguments[index + 1]
            const optionArguments = argument === "--inspect" ? traceArguments : reportArguments
            optionArguments.push(nextArgument && !nextArgument.startsWith("--") ? nextArgument : undefined)
            if (optionArguments[optionArguments.length - 1]) index++
        }
        else {
            runnerArguments.push(argument)
        }
    }

    const testModeFlags = new Set(["--sequential", "--server", "--browser"])
    const selectedModes = runnerArguments.filter(argument => testModeFlags.has(argument))
    const unrecognizedArguments = runnerArguments.filter(argument => !testModeFlags.has(argument))
    const sequentialOnly = selectedModes.includes("--sequential")
    const serverMode = selectedModes.includes("--server")
    const browserMode = selectedModes.includes("--browser")
    const selectedFile = fileArguments.length === 1 ? fileArguments[0] : undefined
    const inspectTracePath = traceArguments.length === 1 ? traceArguments[0] : undefined
    const traceReportPath = reportArguments.length === 1 ? reportArguments[0] : undefined

    if (
        cleanupArguments.length > 1
        || (cleanupArguments.length === 1 && testArguments.length !== 1)
        || keepOutputArguments.length > 1
        || fileArguments.length > 1
        || (fileArguments.length === 1 && !selectedFile)
        || traceArguments.length > 1
        || (traceArguments.length === 1 && !inspectTracePath)
        || reportArguments.length > 1
        || (reportArguments.length === 1 && !traceReportPath)
        || (reportArguments.length > 0 && traceArguments.length !== 1)
        || unrecognizedArguments.length > 0
        || selectedModes.length !== new Set(selectedModes).size
        || (sequentialOnly && (serverMode || browserMode))
        || (fileArguments.length > 0 && selectedModes.length > 0)
        || (traceArguments.length > 0 && (
            cleanupArguments.length > 0
            || keepOutputArguments.length > 0
            || fileArguments.length > 0
            || runnerArguments.length > 0
        ))
    ) {
        throw new Error(testUsage)
    }

    return {
        cleanup: cleanupArguments.length === 1,
        keepOutput: keepOutputArguments.length === 1,
        selectedTestPath: selectedFile ? getSelectedTestPath(projectRoot, selectedFile) : undefined,
        inspectTracePath,
        traceReportPath,
        sequentialOnly,
        serverMode,
        browserMode,
    }
}

function getSelectedTestPath(projectRoot, argument) {
    const normalized = argument.replaceAll("\\", "/").replace(/^\.\//, "")
    const parallelPrefix = "tests/parallel/"
    let testPath

    if (normalized.startsWith(parallelPrefix)) {
        testPath = normalized
    }
    else if (!normalized.includes("/")) {
        testPath = `${parallelPrefix}${normalized}`
    }

    if (!testPath) throw new Error(`Unknown test file: ${argument}\n${testUsage}`)

    const fileName = testPath.slice(parallelPrefix.length)
    const supportedExtension = fileName.endsWith(".server.test.ts")
        || fileName.endsWith(".browser.test.ts")
        || fileName.endsWith(".integration.test.ts")

    if (fileName.includes("/") || !supportedExtension || !existsSync(join(projectRoot, testPath))) {
        throw new Error(`Unknown test file: ${argument}\n${testUsage}`)
    }

    return testPath
}
