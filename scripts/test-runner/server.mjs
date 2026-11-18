import { existsSync } from "node:fs"
import { createHash } from "node:crypto"
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { join, relative, sep } from "node:path"
import { buildFixture, createTest, loadFixture, setTestContext, startServer } from "@nuxt/test-utils/e2e"

export async function cleanupTestOutputFolders(projectRoot) {
    const entries = await readdir(projectRoot, { withFileTypes: true })
    const outputFolders = entries.filter(entry => entry.isDirectory() && entry.name.startsWith(".test-output-"))

    for (const entry of outputFolders) {
        const folderPath = join(projectRoot, entry.name)
        if (relative(projectRoot, folderPath) !== entry.name) {
            throw new Error(`Refusing to remove an unsafe test output directory: ${folderPath}`)
        }
        await rm(folderPath, { recursive: true, force: true })
    }

    return outputFolders
}

export function createTestServer({ projectRoot, testRoot, testAdminName, testAdminPassword }) {
    const testBuildDirectory = join(projectRoot, ".nuxt", "test-runner")
    const testBuildManifestPath = join(testBuildDirectory, "build-inputs.sha256")
    const testFolder = join(projectRoot, testRoot)
    let testApp
    let buildWasCached = false

    return {
        get buildWasCached() {
            return buildWasCached
        },
        async start() {
            await mkdir(join(testFolder, "database"), { recursive: true })
            await mkdir(join(testFolder, "media"), { recursive: true })
            await mkdir(testBuildDirectory, { recursive: true })
            const buildFingerprint = await getBuildFingerprint(projectRoot)
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

            setTestContext(testApp.ctx)
            await loadFixture()
            if (shouldBuild) await buildFixture()
            await startServer(testApp.ctx.options.env)
            const serverUrl = testApp.ctx.url
            if (!serverUrl) throw new Error("The test server did not provide a URL.")
            process.env.CLASSICFORUM_TEST_SERVER_URL = serverUrl
            await waitForAppReady(serverUrl, testApp.ctx.serverLogs)
            if (shouldBuild) await writeFile(testBuildManifestPath, buildFingerprint, "utf8")
        },
        async close() {
            if (testApp) await testApp.afterAll()
        },
    }
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

async function getBuildFingerprint(projectRoot) {
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
        "scripts/test-runner/server.mjs",
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
