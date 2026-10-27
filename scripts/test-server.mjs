import { existsSync } from "node:fs"
import { spawn } from "node:child_process"
import { mkdtemp, mkdir, readdir, rm } from "node:fs/promises"
import { join, relative, sep } from "node:path"
import { createTest } from "@nuxt/test-utils/e2e"

const projectRoot = process.cwd()
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
        phases.push({ testPath: "tests/parallel", sequential: false })
    }

    let passedPhases = 0
    let failedPhase
    let failedExitCode
    let failedOutput = ""
    for (const [index, phase] of phases.entries()) {
        const result = await runVitest(phase.testPath, phase.sequential)
        if (result.exitCode !== 0) {
            process.exitCode = result.exitCode
            failedPhase = phase.testPath
            failedExitCode = result.exitCode
            failedOutput = `${result.stdout}${result.stderr}`
            break
        }
        passedPhases++
    }

    if (failedOutput) {
        process.stderr.write(`\n--- Failure output: ${failedPhase} ---\n`)
        process.stderr.write(failedOutput)
        if (!failedOutput.endsWith("\n")) process.stderr.write("\n")
    }

    const outcome = failedPhase ? `FAIL at ${failedPhase} (exit ${failedExitCode})` : "PASS"
    console.log(`\n[tests] ${outcome}; ${passedPhases}/${phases.length} phases passed`)
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

function runVitest(testPath, sequential) {
    const args = [vitestPath, "run", ...(sequential ? ["--no-file-parallelism"] : []), testPath]
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
        testProcess.once("exit", code => resolve({ exitCode: code ?? 1, stdout, stderr }))
    })
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