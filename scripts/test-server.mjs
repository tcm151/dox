import { spawnSync } from "node:child_process"
import { mkdtemp, mkdir, rm } from "node:fs/promises"
import { join, relative, sep } from "node:path"

const projectRoot = process.cwd()
const testFolder = await mkdtemp(join(projectRoot, ".test-output-"))
const relativeTestFolder = relative(projectRoot, testFolder).split(sep).join("/")

try {
    if (!relativeTestFolder.startsWith(".test-output-") || relativeTestFolder.includes("..")) {
        throw new Error("Refusing to run tests with an unsafe data directory.")
    }

    await mkdir(join(testFolder, "database"), { recursive: true })
    await mkdir(join(testFolder, "media"), { recursive: true })
    process.env.CLASSICFORUM_TEST_DATA_DIRECTORY = relativeTestFolder

    const vitestPath = join(projectRoot, "node_modules", "vitest", "vitest.mjs")
    const result = spawnSync(process.execPath, [vitestPath, "run"], {
            cwd: projectRoot,
            stdio: "inherit",
        },
    )

    if (result.error) throw result.error
    if (result.status !== 0) process.exitCode = result.status ?? 1
}
finally {
    if (!testFolder.startsWith(`${projectRoot}${sep}.test-output-`)) {
        throw new Error("Refusing to remove a test data directory outside the project root.")
    }

    await rm(testFolder, { recursive: true, force: true })
}