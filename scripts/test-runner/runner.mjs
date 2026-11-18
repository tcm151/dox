import { existsSync } from "node:fs"
import { spawn } from "node:child_process"
import { mkdtemp, readFile, rm, readdir } from "node:fs/promises"
import { join, relative, sep } from "node:path"
import { performance } from "node:perf_hooks"
import { createTestReporter, reportVitestFailure } from "./reporting.mjs"
import { createTestServer } from "./server.mjs"

const parallelWorkers = 2

export async function runTests({ projectRoot, options }) {
    const { keepOutput, selectedTestPath } = options
    const testFolder = await mkdtemp(join(projectRoot, ".test-output-"))
    const testRoot = relative(projectRoot, testFolder).split(sep).join("/")
    const testAdminName = "TestAdmin"
    const testAdminPassword = "integration-test-password"
    const vitestPath = join(projectRoot, "node_modules", "vitest", "vitest.mjs")
    const playwrightPath = join(projectRoot, "node_modules", "@playwright", "test", "cli.js")
    const reporter = createTestReporter()
    let testServer

    try {
        if (!testRoot.startsWith(".test-output-") || testRoot.includes("..")) {
            throw new Error("Refusing to run tests with an unsafe data directory.")
        }

        testServer = createTestServer({ projectRoot, testRoot, testAdminName, testAdminPassword })
        await runTimed(reporter, "app startup", () => testServer.start())
        reporter.setBuildWasCached(testServer.buildWasCached)
        process.exitCode = await runTestSuite({
            projectRoot,
            testFolder,
            options,
            reporter,
            vitestPath,
            playwrightPath,
        })
    }
    finally {
        const cleanupStartedAt = performance.now()
        if (testServer) await testServer.close()

        if (!testFolder.startsWith(`${projectRoot}${sep}.test-output-`)) {
            throw new Error("Refusing to remove a test data directory outside the project root.")
        }

        if (keepOutput) {
            console.log(`[test artifacts] ${testFolder}`)
        }
        else {
            await rm(testFolder, { recursive: true, force: true })
        }
        reporter.recordTiming("cleanup", cleanupStartedAt)
        reporter.printTimingSummary(options)
    }
}

async function runTestSuite({ projectRoot, testFolder, options, reporter, vitestPath, playwrightPath }) {
    const { selectedTestPath, sequentialOnly, serverMode, browserMode } = options
    let phaseIndex = 0
    const testSummaries = []
    const hasSuiteMode = serverMode || browserMode
    const runServerSuite = !hasSuiteMode || serverMode
    const runBrowserSuite = !hasSuiteMode || browserMode
    const sequentialSuffixes = selectedTestPath || !runServerSuite
        ? [".setup.test.ts"]
        : [".server.test.ts", ".setup.test.ts"]
    const sequentialTestPaths = await getTestFiles(projectRoot, "sequential", sequentialSuffixes)

    const setupResult = await runTimed(
        reporter,
        selectedTestPath || !runServerSuite ? "required fixtures" : "sequential tests",
        async () => {
            for (const testPath of sequentialTestPaths) {
                const summaryPath = join(testFolder, `phase-${phaseIndex++}-summary.json`)
                const result = await runVitest(projectRoot, vitestPath, testPath, true, summaryPath)
                if (result.summary) testSummaries.push(result.summary)
                if (result.exitCode !== 0) {
                    const phaseName = selectedTestPath || !runServerSuite ? "required setup" : "sequential tests"
                    return reportVitestFailure(result, testPath, phaseName, projectRoot)
                }
            }
            return 0
        },
    )
    if (setupResult !== 0) return setupResult

    const sequentialBrowserPaths = !selectedTestPath && runBrowserSuite
        ? await getTestFiles(projectRoot, "sequential", [".browser.test.ts", ".integration.test.ts"])
        : []
    if (sequentialBrowserPaths.length > 0) {
        const summaryPath = join(testFolder, `phase-${phaseIndex++}-sequential-browser-summary.json`)
        const result = await runTimed(
            reporter,
            "sequential browser suite",
            () => runBrowserTests(projectRoot, playwrightPath, sequentialBrowserPaths, summaryPath, 1),
        )
        reporter.recordBrowserFileTimings(result.summary)
        if (result.summary) testSummaries.push(result.summary)
        if (result.exitCode !== 0) return result.exitCode
    }

    if (sequentialOnly) return reporter.printTestSummary(testSummaries)

    const isBrowserTest = selectedTestPath?.endsWith(".browser.test.ts") || selectedTestPath?.endsWith(".integration.test.ts")
    if (isBrowserTest) {
        const summaryPath = join(testFolder, `phase-${phaseIndex++}-browser-summary.json`)
        const result = await runTimed(
            reporter,
            `browser test ${selectedTestPath}`,
            () => runBrowserTests(projectRoot, playwrightPath, [selectedTestPath], summaryPath, 1),
        )
        reporter.recordBrowserFileTimings(result.summary)
        if (result.summary) testSummaries.push(result.summary)
        if (result.exitCode !== 0) return result.exitCode
    }
    else {
        const serverParallelPaths = selectedTestPath
            ? [selectedTestPath]
            : runServerSuite
                ? await getTestFiles(projectRoot, "parallel", [".server.test.ts"])
                : []
        if (serverParallelPaths.length > 0) {
            const summaryPath = join(testFolder, `phase-${phaseIndex++}-summary.json`)
            const result = await runTimed(
                reporter,
                "parallel server tests",
                () => runVitest(projectRoot, vitestPath, serverParallelPaths, false, summaryPath),
            )
            if (result.summary) testSummaries.push(result.summary)
            if (result.exitCode !== 0) {
                return reportVitestFailure(result, serverParallelPaths.join(", "), "parallel server tests", projectRoot)
            }
        }

        if (!selectedTestPath && runBrowserSuite) {
            const summaryPath = join(testFolder, `phase-${phaseIndex++}-browser-summary.json`)
            const parallelBrowserPaths = await getTestFiles(projectRoot, "parallel", [".browser.test.ts", ".integration.test.ts"])
            if (parallelBrowserPaths.length > 0) {
                const result = await runTimed(
                    reporter,
                    "browser suite",
                    () => runBrowserTests(projectRoot, playwrightPath, parallelBrowserPaths, summaryPath, parallelWorkers),
                )
                reporter.recordBrowserFileTimings(result.summary)
                if (result.summary) testSummaries.push(result.summary)
                if (result.exitCode !== 0) return result.exitCode
            }
        }
    }

    return reporter.printTestSummary(testSummaries)
}

function runBrowserTests(projectRoot, playwrightPath, testPaths, summaryPath, workers) {
    return new Promise((resolve, reject) => {
        const normalizedTestPaths = testPaths.map(testPath => testPath.split(sep).join("/"))
        const testProcess = spawn(
            process.execPath,
            [playwrightPath, "test", "--workers", String(workers), ...normalizedTestPaths],
            {
                cwd: projectRoot,
                env: {
                    ...process.env,
                    CLASSICFORUM_TEST_REPORT_PATH: summaryPath,
                },
                stdio: "inherit",
            },
        )

        testProcess.once("error", reject)
        testProcess.once("exit", code => {
            readPlaywrightSummary(summaryPath)
                .then(summary => resolve({ exitCode: code ?? 1, summary }))
                .catch(reject)
        })
    })
}

function runVitest(projectRoot, vitestPath, testPath, sequential, summaryPath) {
    const testPaths = Array.isArray(testPath) ? testPath : [testPath]
    const args = [
        vitestPath,
        "run",
        "--reporter=default",
        "--reporter=json",
        "--outputFile",
        summaryPath,
        ...(sequential ? ["--no-file-parallelism"] : ["--maxWorkers", String(parallelWorkers)]),
        ...testPaths,
    ]
    return new Promise((resolve, reject) => {
        const testProcess = spawn(process.execPath, args, {
            cwd: projectRoot,
            stdio: ["ignore", "pipe", "pipe"],
        })

        let stdout = ""
        let stderr = ""
        testProcess.stdout.setEncoding("utf8").on("data", chunk => stdout += chunk)
        testProcess.stderr.setEncoding("utf8").on("data", chunk => stderr += chunk)
        testProcess.once("error", reject)
        testProcess.once("exit", code => {
            readVitestReport(summaryPath)
                .then(report => resolve({
                    exitCode: code ?? 1,
                    stdout,
                    stderr,
                    report,
                    summary: report ? {
                        passedFiles: report.numPassedTestSuites,
                        totalFiles: report.numTotalTestSuites,
                        passedTests: report.numPassedTests,
                        totalTests: report.numTotalTests,
                    } : undefined,
                }))
                .catch(reject)
        })
    })
}

async function runTimed(reporter, label, operation) {
    const startedAt = performance.now()
    try {
        return await operation()
    }
    finally {
        reporter.recordTiming(label, startedAt)
    }
}

async function getTestFiles(projectRoot, phase, suffixes) {
    const directory = join(projectRoot, "tests", phase)
    if (!existsSync(directory)) return []

    const entries = await readdir(directory, { withFileTypes: true })
    return entries
        .filter(entry => entry.isFile() && suffixes.some(suffix => entry.name.endsWith(suffix)))
        .map(entry => entry.name)
        .sort((left, right) => left.localeCompare(right))
        .map(fileName => join("tests", phase, fileName))
}

async function readVitestReport(filePath) {
    return readOptionalJson(filePath, "Vitest")
}

async function readPlaywrightSummary(filePath) {
    const report = await readOptionalJson(filePath, "Playwright")
    if (report === undefined) return undefined

    if (typeof report !== "object" || report === null) {
        throw new Error(`Invalid Playwright summary report at ${filePath}.`)
    }

    const stats = report.stats
    if (!stats || !Array.isArray(report.suites)) {
        throw new Error(`Invalid Playwright summary report at ${filePath}.`)
    }

    const passedTests = stats.expected + stats.flaky
    const totalTests = passedTests + stats.unexpected + stats.skipped
    const files = new Map()
    collectBrowserFileTimings(report.suites, files)
    return {
        passedTests,
        totalTests,
        files: [...files].map(([file, durationMs]) => ({ file, durationMs })),
    }
}

async function readOptionalJson(filePath, reportName) {
    let contents
    try {
        contents = await readFile(filePath, "utf8")
    }
    catch (error) {
        if (error.code === "ENOENT") return undefined
        throw error
    }

    try {
        return JSON.parse(contents)
    }
    catch (error) {
        throw new Error(`Invalid ${reportName} report at ${filePath}.`, { cause: error })
    }
}

function collectBrowserFileTimings(suites, files, parentFile) {
    for (const suite of suites) {
        const suiteFile = suite.file || parentFile
        for (const spec of suite.specs ?? []) {
            const file = spec.file || suiteFile
            if (!file) continue
            const durationMs = spec.tests.reduce(
                (total, test) => total + test.results.reduce((testTotal, result) => testTotal + result.duration, 0),
                0,
            )
            const normalizedPath = file.replaceAll("\\", "/")
            const displayPath = normalizedPath.includes("/")
                ? normalizedPath.slice(normalizedPath.lastIndexOf("/tests/") + 1)
                : `tests/parallel/${normalizedPath}`
            files.set(displayPath, (files.get(displayPath) ?? 0) + durationMs)
        }
        collectBrowserFileTimings(suite.suites ?? [], files, suiteFile)
    }
}
