import { createNodeEngines } from "@surrealdb/node"
import { createRemoteEngines, Surreal } from "surrealdb"
import { existsSync, readFileSync } from "node:fs"
import { mkdtemp, mkdir, rm } from "node:fs/promises"
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import assert from "node:assert/strict"

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

export async function useSurrealSandbox(explore) {
    const folder = await mkdtemp(join(projectRoot, ".test-output-"))
    const folderFromRoot = relative(projectRoot, folder)
    const safeFolder = dirname(resolve(folder)) === projectRoot && basename(folder).startsWith(".test-output-")
    const databasePath = join(folder, "database", "exploration.db")
    const databaseUrl = `rocksdb://${relative(projectRoot, databasePath).split(sep).join("/")}`
    const database = new Surreal({
        engines: {
            ...createRemoteEngines(),
            ...createNodeEngines(),
        },
    })

    try {
        if (!safeFolder || folderFromRoot.includes("..")) {
            throw new Error("Refusing to create an exploration database outside the project root.")
        }

        await mkdir(dirname(databasePath), { recursive: true })
        await database.connect(databaseUrl, {
            namespace: "surreal_exploration",
            database: "scratch",
        })
        return await explore(database)
    }
    finally {
        try {
            await database.close()
        }
        finally {
            if (!safeFolder) {
                throw new Error("Refusing to remove an exploration directory outside the project root.")
            }

            await rm(folder, { recursive: true, force: true })
        }
    }
}

async function main() {
    const explorationPath = process.argv[2]
    if (!explorationPath) {
        throw new Error("Usage: node scripts/surreal-explore.mjs <exploration.mjs> | - (read an inline exploration from stdin)")
    }

    if (explorationPath === "-") {
        const source = readFileSync(0, "utf8")
        if (!source.trim()) {
            throw new Error("No inline exploration was provided on stdin.")
        }

        const asyncFunction = Object.getPrototypeOf(async function () {}).constructor
        const explore = new asyncFunction("db", "assert", source)
        const result = await useSurrealSandbox(database => explore(database, assert))
        if (result !== undefined) {
            console.log(JSON.stringify(result, null, 2))
        }
        return
    }

    const absolutePath = isAbsolute(explorationPath) ? explorationPath : resolve(process.cwd(), explorationPath)
    if (!existsSync(absolutePath)) {
        throw new Error(`Exploration file does not exist: ${explorationPath}`)
    }

    const exploration = await import(pathToFileURL(absolutePath).href)
    if (typeof exploration.default !== "function") {
        throw new Error("The exploration module must default-export an async function that accepts a Surreal connection.")
    }

    const result = await useSurrealSandbox(exploration.default)
    if (result !== undefined) {
        console.log(JSON.stringify(result, null, 2))
    }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch(error => {
        console.error(error)
        process.exitCode = 1
    })
}