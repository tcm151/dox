import { execFileSync } from "node:child_process"
import { createNodeEngines } from "@surrealdb/node"
import { createRemoteEngines, Surreal } from "surrealdb"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { mkdtemp, mkdir, rm } from "node:fs/promises"
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import assert from "node:assert/strict"

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

function parseReleaseVersion(version) {
    const match = /^(?:v)?(\d+(?:\.\d+)*)$/.exec(version)
    if (!match) {
        throw new Error(`Invalid release version: ${version}`)
    }
    return match[1]
}

function compareVersions(left, right) {
    return left.localeCompare(right, undefined, { numeric: true })
}

export function getPreviousReleaseTag(version) {
    const targetVersion = parseReleaseVersion(version)
    const tags = execFileSync("git", ["tag", "--list", "v*"], {
        cwd: projectRoot,
        encoding: "utf8",
    }).split(/\r?\n/).filter(tag => /^v\d+(?:\.\d+)*$/.test(tag))

    const previousTag = tags
        .map(tag => ({ tag, version: parseReleaseVersion(tag) }))
        .filter(release => compareVersions(release.version, targetVersion) < 0)
        .sort((left, right) => compareVersions(right.version, left.version))[0]

    if (!previousTag) {
        throw new Error(`No tagged release exists before ${targetVersion}.`)
    }
    return previousTag.tag
}

export async function applySchema(database, version) {
    const schema = readFileSync(join(projectRoot, "server", "assets", "schema.surql"), "utf8")
    return await database.query(schema, { version: parseReleaseVersion(version) })
}

export async function applySchemaFromTag(database, tag) {
    const version = parseReleaseVersion(tag)
    const schema = execFileSync("git", ["show", `${tag}:server/assets/schema.surql`], {
        cwd: projectRoot,
        encoding: "utf8",
    })
    return await database.query(schema, { version })
}

export function getMigration(version) {
    const normalizedVersion = parseReleaseVersion(version)
    return readFileSync(join(projectRoot, "server", "assets", "migrations", `${normalizedVersion}.surql`), "utf8")
}

export async function applyMigration(database, version) {
    return await database.query(getMigration(version))
}

export async function applyMigrations(database, fromVersion, toVersion) {
    const firstVersion = parseReleaseVersion(fromVersion)
    const lastVersion = parseReleaseVersion(toVersion)
    const migrations = readdirSync(join(projectRoot, "server", "assets", "migrations"))
        .filter(file => /^\d+(?:\.\d+)*\.surql$/.test(file))
        .map(file => file.slice(0, -".surql".length))
        .filter(version => compareVersions(version, firstVersion) > 0 && compareVersions(version, lastVersion) <= 0)
        .sort(compareVersions)

    for (const version of migrations) {
        await applyMigration(database, version)
    }
    return migrations
}

function createExploreTools(database) {
    return {
        applySchema: version => applySchema(database, version),
        applySchemaFromTag: tag => applySchemaFromTag(database, tag),
        getMigration,
        applyMigration: version => applyMigration(database, version),
        applyMigrations: (fromVersion, toVersion) => applyMigrations(database, fromVersion, toVersion),
        getPreviousReleaseTag,
    }
}

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
        const explore = new asyncFunction("db", "assert", "tools", source)
        const result = await useSurrealSandbox(database => explore(database, assert, createExploreTools(database)))
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