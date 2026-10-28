import { existsSync } from "node:fs"
import { spawn } from "node:child_process"
import { mkdtemp, mkdir, readFile, readdir, rm } from "node:fs/promises"
import { join, relative, sep } from "node:path"
import { createTest } from "@nuxt/test-utils/e2e"

const projectRoot = process.cwd()
const parallelTestArgument = process.argv[2]
if (process.argv.length > 3) {
    throw new Error("Usage: yarn test [tests/parallel/<file>.test.ts]")
}
const selectedParallelTest = parallelTestArgument ? getParallelTestPath(parallelTestArgument) : undefined
const testFolder = await mkdtemp(join(projectRoot, ".test-output-"))
const testRoot = relative(projectRoot, testFolder).split(sep).join("/")
const vitestPath = join(projectRoot, "node_modules", "vitest", "vitest.mjs")
const testAdminName = "TestAdmin"
const testAdminPassword = "integration-test-password"
let testApp

try {
    if (!testRoot.startsWith(".test-output-") || testRoot.includes("..")) {
        throw new Error("Refusing to run tests with an unsafe data directory.")
    }

    await mkdir(join(testFolder, "database"), { recursive: true })
    await mkdir(join(testFolder, "media"), { recursive: true })
    process.env.CLASSICFORUM_TEST_DATA_DIRECTORY = testRoot
    process.env.CLASSICFORUM_TEST_ADMIN_NAME = testAdminName
    process.env.CLASSICFORUM_TEST_ADMIN_PASSWORD = testAdminPassword
    testApp = createTest({
        logLevel: 0,
        nuxtConfig: {
            vite: { logLevel: "warn" },
            nitro: {
                logLevel: 0,
                logging: { buildSuccess: false },
            },
        },
        rootDir: projectRoot,
        env: {
            NUXT_DATA_PATH: `${testRoot}/media`,
            NUXT_TRUSTED_PROXIES: "127.0.0.1,::1",
            NUXT_SURREAL_INFO_TYPE: "embedded",
            NUXT_SURREAL_INFO_URL: `rocksdb://${testRoot}/database/default.db`,
            NUXT_SURREAL_INFO_NAMESPACE: "classicforum_test",
            NUXT_SURREAL_INFO_DATABASE: "integration_test",
            NUXT_SURREAL_ADMIN_EMAIL: "test@example.invalid",
            NUXT_SURREAL_ADMIN_NAME: testAdminName,
            NUXT_SURREAL_ADMIN_PASSWORD: testAdminPassword,
        },
    })

    await testApp.beforeAll()
    const serverUrl = testApp.ctx.url
    if (!serverUrl) throw new Error("The test server did not provide a URL.")

    process.env.CLASSICFORUM_TEST_SERVER_URL = serverUrl
    await waitForAppReady(serverUrl, testApp.ctx.serverLogs)

    const phases = [
        ...["tests/health.test.ts", ...await getSequentialTestFiles()].map(testPath => ({ testPath, sequential: true })),
    ]
    if (existsSync(join(projectRoot, "tests", "parallel"))) {
        phases.push({ testPath: selectedParallelTest ?? "tests/parallel", sequential: false })
    }

    let failedPhase
    let failedExitCode
    let failedOutput = ""
    let failedReport
    const testSummaries = []
    for (const [index, phase] of phases.entries()) {
        const summaryPath = join(testFolder, `phase-${index}-summary.json`)
        const result = await runVitest(phase.testPath, phase.sequential, summaryPath)
        if (result.summary) testSummaries.push(result.summary)
        if (result.exitCode !== 0) {
            process.exitCode = result.exitCode
            failedPhase = phase.testPath
            failedExitCode = result.exitCode
            failedOutput = `${result.stdout}${result.stderr}`
            failedReport = result.report
            break
        }
    }

    const failureDetails = formatFailureDetails(failedReport)
    if (failureDetails) {
        process.stderr.write(`\n${failureDetails}\n`)
    }
    else if (failedOutput) {
        process.stderr.write(`\n--- Failure output: ${failedPhase} ---\n`)
        process.stderr.write(failedOutput)
        if (!failedOutput.endsWith("\n")) process.stderr.write("\n")
    }

    const passedTests = testSummaries.reduce((total, summary) => total + summary.passedTests, 0)
    const totalTests = testSummaries.reduce((total, summary) => total + summary.totalTests, 0)
    const outcome = failedPhase
        ? `${passedTests}/${totalTests} tests passed; failed at ${failedPhase} (exit ${failedExitCode})`
        : `${passedTests}/${totalTests} tests passed`
    console.log(`\n[tests] ${outcome}`)
}
finally {
    if (testApp) await testApp.afterAll()

    if (!testFolder.startsWith(`${projectRoot}${sep}.test-output-`)) {
        throw new Error("Refusing to remove a test data directory outside the project root.")
    }

    await rm(testFolder, { recursive: true, force: true })
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

function runVitest(testPath, sequential, summaryPath) {
    const args = [
        vitestPath,
        "run",
        "--reporter=json",
        "--outputFile",
        summaryPath,
        ...(sequential ? ["--no-file-parallelism"] : []),
        testPath,
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

function formatFailureDetails(report) {
    const failedFiles = report?.testResults?.filter(result => result.status === "failed") ?? []
    if (failedFiles.length === 0) return ""

    const lines = ["--- Failed tests ---"]
    for (const file of failedFiles) {
        const filePath = relative(projectRoot, file.name).replaceAll("\\", "/")
        lines.push(`\n${filePath}`)
        const failedAssertions = file.assertionResults?.filter(result => result.status === "failed") ?? []
        if (failedAssertions.length === 0) {
            lines.push(...(file.message || "Test file failed before an assertion completed.").split(/\r?\n/).map(line => `  ${line}`))
            continue
        }

        for (const assertion of failedAssertions) {
            lines.push(`  FAIL ${assertion.fullName || assertion.title}`)
            for (const message of assertion.failureMessages ?? []) {
                const messageLines = message.split(/\r?\n/)
                const firstFrame = messageLines.findIndex(line => /^\s+at /.test(line))
                const details = firstFrame < 0 ? messageLines : messageLines.slice(0, firstFrame)
                lines.push(...details.slice(0, 10).map(line => `    ${line}`))

                if (assertion.location) {
                    lines.push(`    at ${filePath}:${assertion.location.line}:${assertion.location.column}`)
                }
                else {
                    const sourceFrame = messageLines.find(line => line.replaceAll("\\", "/").includes(filePath))
                    if (sourceFrame) {
                        const normalizedFrame = sourceFrame.trim().replaceAll("\\", "/")
                        const pathIndex = normalizedFrame.indexOf(filePath)
                        lines.push(`    at ${normalizedFrame.slice(pathIndex)}`)
                    }
                }
            }
        }
    }

    return lines.join("\n")
}

async function getSequentialTestFiles() {
    const directory = join(projectRoot, "tests", "sequential")
    if (!existsSync(directory)) return []

    const entries = await readdir(directory, { withFileTypes: true })
    return entries
        .filter(entry => entry.isFile() && entry.name.endsWith(".test.ts"))
        .map(entry => entry.name)
        .sort((left, right) => left.localeCompare(right))
        .map(fileName => join("tests", "sequential", fileName))
}

function getParallelTestPath(argument) {
    const normalized = argument.replaceAll("\\", "/").replace(/^\.\//, "")
    const prefix = "tests/parallel/"
    const fileName = normalized.startsWith(prefix) ? normalized.slice(prefix.length) : normalized
    const testPath = join("tests", "parallel", fileName)

    if (fileName.includes("/") || !fileName.endsWith(".test.ts") || !existsSync(join(projectRoot, testPath))) {
        throw new Error(`Unknown parallel test file: ${argument}\nUsage: yarn test [tests/parallel/<file>.test.ts]`)
    }

    return testPath
}