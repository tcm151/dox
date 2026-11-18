import { existsSync } from "node:fs"
import { createHash } from "node:crypto"
import { spawn } from "node:child_process"
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { join, relative, sep } from "node:path"
import { performance } from "node:perf_hooks"
import { buildFixture, createTest, loadFixture, setTestContext, startServer } from "@nuxt/test-utils/e2e"
import { formatFailureDetails, formatVitestFailureOutput } from "./test-reporting.mjs"

const projectRoot = process.cwd()
const testBuildDirectory = join(projectRoot, ".nuxt", "test-runner")
const testBuildManifestPath = join(testBuildDirectory, "build-inputs.sha256")
const slowFileThresholdMs = 10_000
const timings = []
const runStartedAt = performance.now()
let buildWasCached = false
const testArguments = process.argv.slice(2)
const keepOutputArguments = testArguments.filter(argument => argument === "--keep-output")
const unparsedArguments = testArguments.filter(argument => argument !== "--keep-output")
const fileArguments = []
const runnerArguments = []
for (let index = 0; index < unparsedArguments.length; index++) {
    const argument = unparsedArguments[index]
    if (argument === "--file") {
        const fileArgument = unparsedArguments[index + 1]
        fileArguments.push(fileArgument && !fileArgument.startsWith("--") ? fileArgument : undefined)
        if (fileArguments[fileArguments.length - 1]) index++
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
const testUsage = "Usage: yarn test [--keep-output] [--sequential | --server | --browser | --file <parallel-test-file>]"
if (
    keepOutputArguments.length > 1
    || fileArguments.length > 1
    || (fileArguments.length === 1 && !selectedFile)
    || unrecognizedArguments.length > 0
    || selectedModes.length !== new Set(selectedModes).size
    || (sequentialOnly && (serverMode || browserMode))
    || (fileArguments.length > 0 && selectedModes.length > 0)
) {
    throw new Error(testUsage)
}
const selectedParallelTest = selectedFile ? getParallelTestPath(selectedFile) : undefined
const testFolder = await mkdtemp(join(projectRoot, ".test-output-"))
const testRoot = relative(projectRoot, testFolder).split(sep).join("/")
const vitestPath = join(projectRoot, "node_modules", "vitest", "vitest.mjs")
const playwrightPath = join(projectRoot, "node_modules", "@playwright", "test", "cli.js")
const testAdminName = "TestAdmin"
const testAdminPassword = "integration-test-password"
const keepTestOutput = keepOutputArguments.length === 1
let testApp

try {
    if (!testRoot.startsWith(".test-output-") || testRoot.includes("..")) {
        throw new Error("Refusing to run tests with an unsafe data directory.")
    }

    await mkdir(join(testFolder, "database"), { recursive: true })
    await mkdir(join(testFolder, "media"), { recursive: true })
    await mkdir(testBuildDirectory, { recursive: true })
    const buildFingerprint = await getBuildFingerprint()
    const cachedBuildFingerprint = await readFile(testBuildManifestPath, "utf8").catch(() => undefined)
    const hasBuiltServer = existsSync(join(testBuildDirectory, "output", "server", "index.mjs"))
    const shouldBuild = !hasBuiltServer || cachedBuildFingerprint !== buildFingerprint
    buildWasCached = !shouldBuild
    process.env.CLASSICFORUM_TEST_DATA_DIRECTORY = testRoot
    process.env.CLASSICFORUM_TEST_ADMIN_NAME = testAdminName
    process.env.CLASSICFORUM_TEST_ADMIN_PASSWORD = testAdminPassword
    testApp = createTest({
        build: shouldBuild,
        buildDir: testBuildDirectory,
        logLevel: 0,
        nuxtConfig: {
            vite: {
                logLevel: "error",
                build: { rolldownOptions: { checks: { bundlerTimings: false } } },
            },
            nitro: {
                logLevel: 0,
                logging: { buildSuccess: false },
            },
        },
        rootDir: projectRoot,
        env: {
            NUXT_DATA_PATH: `${testRoot}/media`,
            NUXT_TRUSTED_PROXIES: "127.0.0.1,::1",
            NUXT_SMTP_HOST: "127.0.0.1",
            NUXT_SMTP_PORT: "1",
            NUXT_SURREAL_INFO_TYPE: "embedded",
            NUXT_SURREAL_INFO_URL: `rocksdb://${testRoot}/database/default.db`,
            NUXT_SURREAL_INFO_NAMESPACE: "classicforum_test",
            NUXT_SURREAL_INFO_DATABASE: "integration_test",
            NUXT_SURREAL_ADMIN_EMAIL: "test@example.invalid",
            NUXT_SURREAL_ADMIN_NAME: testAdminName,
            NUXT_SURREAL_ADMIN_PASSWORD: testAdminPassword,
        },
    })

    await runTimed("app startup", async () => {
        setTestContext(testApp.ctx)
        await loadFixture()
        if (shouldBuild) await buildFixture()
        await startServer(testApp.ctx.options.env)
        const serverUrl = testApp.ctx.url
        if (!serverUrl) throw new Error("The test server did not provide a URL.")

        process.env.CLASSICFORUM_TEST_SERVER_URL = serverUrl
        await waitForAppReady(serverUrl, testApp.ctx.serverLogs)
    })
    if (shouldBuild) await writeFile(testBuildManifestPath, buildFingerprint, "utf8")

    process.exitCode = await runTestSuite(testFolder)
}
finally {
    const cleanupStartedAt = performance.now()
    if (testApp) await testApp.afterAll()

    if (!testFolder.startsWith(`${projectRoot}${sep}.test-output-`)) {
        throw new Error("Refusing to remove a test data directory outside the project root.")
    }

    if (keepTestOutput) {
        console.log(`[test artifacts] ${testFolder}`)
    }
    else {
        await rm(testFolder, { recursive: true, force: true })
    }
    recordTiming("cleanup", cleanupStartedAt)
    printTimingSummary()
}

async function waitForAppReady(serverUrl, serverLogs) {
    const deadline = Date.now() + 60_000
    let lastHealth

    while (Date.now() < deadline) {
        try {
            const response = await fetch(new URL("/api/health", serverUrl))
            lastHealth = await response.json()

            if (response.ok && lastHealth.app === "ready" && lastHealth.database === "ready") return
            if (lastHealth.app === "failed") break
        }
        catch (error) {
            lastHealth = { error: error instanceof Error ? error.message : String(error) }
        }

        await new Promise(resolve => setTimeout(resolve, 250))
    }

    throw new Error(
        `Test server did not become ready. Last health: ${JSON.stringify(lastHealth)}\n${serverLogs.join("\n")}`,
    )
}

async function getBuildFingerprint() {
    const buildInputs = [
        "app",
        "server",
        "shared",
        "public",
        "nuxt.config.ts",
        "package.json",
        "yarn.lock",
        "tsconfig.json",
        "golar.config.ts",
        "scripts/test-server.mjs",
        ".env",
    ]
    const files = []
    for (const input of buildInputs) {
        files.push(...await collectBuildFiles(join(projectRoot, input)))
    }
    files.sort((left, right) => left.localeCompare(right))

    const hash = createHash("sha256")
    for (const file of files) {
        hash.update(relative(projectRoot, file).split(sep).join("/"))
        hash.update(await readFile(file))
    }
    return hash.digest("hex")
}

async function collectBuildFiles(path) {
    let entries
    try {
        entries = await readdir(path, { withFileTypes: true })
    }
    catch {
        return existsSync(path) ? [path] : []
    }

    const files = []
    for (const entry of entries) {
        const entryPath = join(path, entry.name)
        if (entry.isDirectory()) files.push(...await collectBuildFiles(entryPath))
        else if (entry.isFile()) files.push(entryPath)
    }
    return files
}

function runBrowserTests(testPath, summaryPath) {
    return new Promise((resolve, reject) => {
        const testProcess = spawn(process.execPath, [playwrightPath, "test", ...(testPath ? [testPath] : [])], {
            cwd: projectRoot,
            env: {
                ...process.env,
                CLASSICFORUM_TEST_REPORT_PATH: summaryPath,
            },
            stdio: "inherit",
        })

        testProcess.once("error", reject)
        testProcess.once("exit", async (code) => {
            resolve({
                exitCode: code ?? 1,
                summary: await readPlaywrightSummary(summaryPath),
            })
        })
    })
}

async function runTestSuite(testFolder) {
    let phaseIndex = 0
    const testSummaries = []
    const hasSuiteMode = serverMode || browserMode
    const runServerSuite = !hasSuiteMode || serverMode
    const runBrowserSuite = !hasSuiteMode || browserMode
    const sequentialSuffixes = selectedParallelTest || !runServerSuite
        ? [".setup.test.ts"]
        : [".server.test.ts", ".setup.test.ts"]
    const sequentialTestPaths = await getTestFiles("sequential", sequentialSuffixes)

    const setupResult = await runTimed(
        selectedParallelTest || !runServerSuite ? "required fixtures" : "sequential tests",
        async () => {
            for (const testPath of sequentialTestPaths) {
                const summaryPath = join(testFolder, `phase-${phaseIndex++}-summary.json`)
                const result = await runVitest(testPath, true, summaryPath)
                if (result.summary) testSummaries.push(result.summary)
                if (result.exitCode !== 0) {
                    const phaseName = selectedParallelTest || !runServerSuite ? "required setup" : "sequential tests"
                    return reportVitestFailure(result, testPath, phaseName)
                }
            }
            return 0
        },
    )
    if (setupResult !== 0) return setupResult
    if (sequentialOnly) return printTestSummary(testSummaries)

    const isBrowserTest = selectedParallelTest?.endsWith(".browser.test.ts") || selectedParallelTest?.endsWith(".integration.test.ts")
    if (isBrowserTest) {
        const summaryPath = join(testFolder, `phase-${phaseIndex++}-browser-summary.json`)
        const result = await runTimed(`browser test ${selectedParallelTest}`, () => runBrowserTests(selectedParallelTest, summaryPath))
        recordBrowserFileTimings(result.summary)
        if (result.summary) testSummaries.push(result.summary)
        if (result.exitCode !== 0) return result.exitCode
    }
    else {
        const serverParallelPaths = selectedParallelTest
            ? [selectedParallelTest]
            : runServerSuite
                ? await getTestFiles("parallel", [".server.test.ts"])
                : []
        if (serverParallelPaths.length > 0) {
            const summaryPath = join(testFolder, `phase-${phaseIndex++}-summary.json`)
            const result = await runTimed("parallel server tests", () => runVitest(serverParallelPaths, false, summaryPath))
            if (result.summary) testSummaries.push(result.summary)
            if (result.exitCode !== 0) return reportVitestFailure(result, serverParallelPaths.join(", "), "parallel server tests")
        }
        if (!selectedParallelTest && runBrowserSuite) {
            const summaryPath = join(testFolder, `phase-${phaseIndex++}-browser-summary.json`)
            const result = await runTimed("browser suite", () => runBrowserTests(undefined, summaryPath))
            recordBrowserFileTimings(result.summary)
            if (result.summary) testSummaries.push(result.summary)
            if (result.exitCode !== 0) return result.exitCode
        }
    }

    return printTestSummary(testSummaries)
}

function printTestSummary(testSummaries) {
    const passedTests = testSummaries.reduce((total, summary) => total + summary.passedTests, 0)
    const totalTests = testSummaries.reduce((total, summary) => total + summary.totalTests, 0)
    console.log(`\n[tests] ${passedTests}/${totalTests} tests passed`)
    return 0
}

async function runTimed(label, operation) {
    const startedAt = performance.now()
    try {
        return await operation()
    }
    finally {
        recordTiming(label, startedAt)
    }
}

function recordTiming(label, startedAt) {
    recordDuration(label, performance.now() - startedAt)
}

function recordDuration(label, durationMs) {
    timings.push({ label, durationMs })
}

function recordBrowserFileTimings(summary) {
    if (!summary) return
    for (const { file, durationMs } of summary.files) {
        recordDuration(`browser file ${file} test time`, durationMs)
    }
}

function printTimingSummary() {
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
        `${selectedParallelTest ? "fixtures" : "sequential"} ${formatDuration(setupDuration)}`,
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
}

function formatDuration(durationMs) {
    return `${(durationMs / 1000).toFixed(1)}s`
}

function reportVitestFailure(result, testPath, phaseName) {
    const vitestOutput = [result.stdout, result.stderr].filter(Boolean).join("\n").trim()
    const vitestFailureDetails = formatVitestFailureOutput(vitestOutput)
    if (vitestFailureDetails) {
        const maxOutputCharacters = 12_000
        const output = vitestFailureDetails.length > maxOutputCharacters
            ? `[Earlier failure details omitted]\n${vitestFailureDetails.slice(-maxOutputCharacters)}`
            : vitestFailureDetails
        process.stderr.write(`\n--- Vitest failure: ${phaseName} (${testPath}) ---\n${output}\n`)
        const maxCapturedOutputCharacters = 12_000
        const capturedOutput = vitestOutput.length > maxCapturedOutputCharacters
            ? `[Earlier captured output omitted]\n${vitestOutput.slice(-maxCapturedOutputCharacters)}`
            : vitestOutput
        process.stderr.write(`\n--- Captured Vitest stdout/stderr ---\n${capturedOutput}\n`)
        return result.exitCode
    }

    const failureDetails = formatFailureDetails(result.report)
    if (failureDetails) {
        process.stderr.write(`\n${failureDetails}\n`)
    }
    else if (vitestOutput) {
        const maxOutputCharacters = 4_000
        const output = vitestOutput.length > maxOutputCharacters
            ? `[Earlier Vitest output omitted]\n${vitestOutput.slice(-maxOutputCharacters)}`
            : vitestOutput
        process.stderr.write(`\n--- Vitest failure output: ${phaseName} (${testPath}) ---\n${output}\n`)
    }
    return result.exitCode
}

function runVitest(testPath, sequential, summaryPath) {
    const testPaths = Array.isArray(testPath) ? testPath : [testPath]
    const args = [
        vitestPath,
        "run",
        "--reporter=default",
        "--reporter=json",
        "--outputFile",
        summaryPath,
        ...(sequential ? ["--no-file-parallelism"] : []),
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
        testProcess.once("exit", async code => {
            const report = await readVitestReport(summaryPath)
            resolve({
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
            })
        })
    })
}

async function readVitestReport(filePath) {
    try {
        return JSON.parse(await readFile(filePath, "utf8"))
    }
    catch {
        return undefined
    }
}

async function readPlaywrightSummary(filePath) {
    try {
        const report = JSON.parse(await readFile(filePath, "utf8"))
        const stats = report.stats
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
    catch {
        return undefined
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

async function getTestFiles(phase, suffixes) {
    const directory = join(projectRoot, "tests", phase)
    if (!existsSync(directory)) return []

    const entries = await readdir(directory, { withFileTypes: true })
    return entries
        .filter(entry => entry.isFile() && suffixes.some(suffix => entry.name.endsWith(suffix)))
        .map(entry => entry.name)
        .sort((left, right) => left.localeCompare(right))
        .map(fileName => join("tests", phase, fileName))
}

function getParallelTestPath(argument) {
    const normalized = argument.replaceAll("\\", "/").replace(/^\.\//, "")
    const prefix = "tests/parallel/"
    if (
        normalized.startsWith("tests/sequential/")
        || (!normalized.includes("/") && existsSync(join(projectRoot, "tests", "sequential", normalized)))
    ) {
        throw new Error(`Individual --file selection only supports tests/parallel; sequential tests must run in order with --sequential or the full suite.\n${testUsage}`)
    }

    const fileName = normalized.startsWith(prefix) ? normalized.slice(prefix.length) : normalized
    const testPath = `${prefix}${fileName}`
    const supportedExtension = fileName.endsWith(".server.test.ts")
        || fileName.endsWith(".browser.test.ts")
        || fileName.endsWith(".integration.test.ts")

    if (fileName.includes("/") || !supportedExtension || !existsSync(join(projectRoot, testPath))) {
        throw new Error(`Unknown parallel test file: ${argument}\n${testUsage}`)
    }

    return testPath
}
