import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

function requireFile(path, message) {
    if (!existsSync(path)) {
        console.error(message)
        process.exit(1)
    }
}

const artifactRoot = "forum"
const rootDir = dirname(dirname(fileURLToPath(import.meta.url)))
const rootPackage = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf8"))
const version = rootPackage.version
const platform = process.platform === "win32" ? "windows" : process.platform
const outputDir = join(rootDir, ".output")
const releasesDir = join(rootDir, "releases")
const artifactDir = join(outputDir, artifactRoot, version)
const serverDir = join(artifactDir, "server")
const generatedServerPackagePath = join(outputDir, "server", "package.json")
const archivePath = join(releasesDir, `${artifactRoot}-${version}-${platform}-${process.arch}.tar.gz`)

const installer = join(rootDir, "scripts", "installer.sh")
const releaseEnv = join(rootDir, "scripts", "release.env")
const quickstart = join(rootDir, "docs", "Quickstart.md")
const yarnLock = join(rootDir, "yarn.lock")

requireFile(join(outputDir, "server", "index.mjs"), "Missing .output/server/index.mjs. Run yarn build before staging a release.")
requireFile(generatedServerPackagePath, "Missing .output/server/package.json. Run yarn build before staging a release.")
requireFile(installer, "Missing scripts/installer.sh.")
requireFile(releaseEnv, "Missing scripts/release.env.")
requireFile(quickstart, "Missing docs/Quickstart.md.")
requireFile(yarnLock, "Missing yarn.lock; production dependencies cannot be staged reproducibly.")

rmSync(join(outputDir, artifactRoot), { recursive: true, force: true })
mkdirSync(artifactDir, { recursive: true })
mkdirSync(releasesDir, { recursive: true })

// Copy the Nuxt build output into the final archive layout before creating the tarball.
for (const entry of readdirSync(outputDir)) {
    if (entry !== artifactRoot) {
        cpSync(join(outputDir, entry), join(artifactDir, entry), { recursive: true })
    }
}

cpSync(installer, join(artifactDir, "installer.sh"))
cpSync(releaseEnv, join(artifactDir, ".env.example"))
cpSync(quickstart, join(artifactDir, "Quickstart.md"))
chmodSync(join(artifactDir, "installer.sh"), 0o755)

const runtimeInstallDir = join(artifactDir, ".runtime-install")
mkdirSync(runtimeInstallDir, { recursive: true })
const generatedServerPackage = JSON.parse(readFileSync(generatedServerPackagePath, "utf8"))
const runtimeDependencies = {
    ...generatedServerPackage.dependencies,
    ...rootPackage.dependencies,
}
for (const dependency of Object.keys(runtimeDependencies)) {
    if (dependency.startsWith("@img/sharp-")) {
        delete runtimeDependencies[dependency]
    }
}
writeFileSync(join(runtimeInstallDir, "package.json"), JSON.stringify({
    private: true,
    dependencies: runtimeDependencies,
}, null, 2))
cpSync(yarnLock, join(runtimeInstallDir, "yarn.lock"))
const yarnArgs = [
    "install",
    "--production",
    "--pure-lockfile",
    "--modules-folder",
    normalizePath(join(serverDir, "node_modules")),
]

if (process.platform === "win32") {
    const yarnCli = join(dirname(process.execPath), "node_modules", "yarn", "bin", "yarn.js")
    requireFile(yarnCli, "Missing Yarn CLI beside Node.js; install the project-pinned Yarn version before staging.")
    execFileSync(process.execPath, [yarnCli, ...yarnArgs], { cwd: runtimeInstallDir, stdio: "inherit" })
}
else {
    execFileSync("yarn", yarnArgs, { cwd: runtimeInstallDir, stdio: "inherit" })
}
rmSync(runtimeInstallDir, { recursive: true, force: true })

requireFile(join(artifactDir, "installer.sh"), "Staged artifact is missing installer.sh.")
requireFile(join(artifactDir, ".env.example"), "Staged artifact is missing .env.example.")
requireFile(join(artifactDir, "Quickstart.md"), "Staged artifact is missing Quickstart.md.")
requireFile(join(artifactDir, "server", "index.mjs"), "Staged artifact is missing server/index.mjs.")
requireFile(join(serverDir, "node_modules", "surrealdb", "package.json"), "Staged artifact is missing the surrealdb runtime dependency.")
requireFile(join(serverDir, "node_modules", "@surrealdb", "node", "package.json"), "Staged artifact is missing the embedded SurrealDB runtime dependency.")
requireFile(join(serverDir, "node_modules", "@surrealdb", "node-native", "package.json"), "Staged artifact is missing the embedded SurrealDB native engine dependency.")
requireFile(join(serverDir, "node_modules", "sharp", "package.json"), "Staged artifact is missing the sharp runtime dependency.")
requireFile(join(serverDir, "node_modules", "vue-bundle-renderer", "package.json"), "Staged artifact is missing the Nuxt SSR runtime dependency.")

function normalizePath(value) {
    return value.replace(/\\/g, "/")
}

rmSync(archivePath, { force: true })
const tarArgs = ["-czf", archivePath, "-C", normalizePath(outputDir), normalizePath(join(artifactRoot, version))]
execFileSync("tar", tarArgs, { stdio: "inherit" })
requireFile(archivePath, `Release archive was not created: ${archivePath}`)
rmSync(outputDir, { recursive: true, force: true })

console.log(`Created release archive at ${archivePath}`)