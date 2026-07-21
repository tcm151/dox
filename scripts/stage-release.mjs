import { execFileSync } from "node:child_process"
import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync } from "node:fs"
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
const version = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf8")).version
const outputDir = join(rootDir, ".output")
const releasesDir = join(rootDir, "releases")
const artifactDir = join(outputDir, artifactRoot, version)
const archivePath = join(releasesDir, `${artifactRoot}-${version}.tar.gz`)

const installer = join(rootDir, "scripts", "installer.sh")
const releaseEnv = join(rootDir, "scripts", "release.env")
const quickstart = join(rootDir, "docs", "Quickstart.md")

requireFile(join(outputDir, "server", "index.mjs"), "Missing .output/server/index.mjs. Run yarn build before staging a release.")
requireFile(installer, "Missing scripts/installer.sh.")
requireFile(releaseEnv, "Missing scripts/release.env.")
requireFile(quickstart, "Missing docs/Quickstart.md.")

rmSync(join(outputDir, artifactRoot), { recursive: true, force: true })
mkdirSync(artifactDir, { recursive: true })
mkdirSync(releasesDir, { recursive: true })

// Move the Nuxt build output into the final archive layout before creating the tarball.
for (const entry of readdirSync(outputDir)) {
    if (entry !== artifactRoot) {
        renameSync(join(outputDir, entry), join(artifactDir, entry))
    }
}

cpSync(installer, join(artifactDir, "installer.sh"))
cpSync(releaseEnv, join(artifactDir, ".env.example"))
cpSync(quickstart, join(artifactDir, "Quickstart.md"))
chmodSync(join(artifactDir, "installer.sh"), 0o755)

requireFile(join(artifactDir, "installer.sh"), "Staged artifact is missing installer.sh.")
requireFile(join(artifactDir, ".env.example"), "Staged artifact is missing .env.example.")
requireFile(join(artifactDir, "Quickstart.md"), "Staged artifact is missing Quickstart.md.")
requireFile(join(artifactDir, "server", "index.mjs"), "Staged artifact is missing server/index.mjs.")

rmSync(archivePath, { force: true })
execFileSync("tar", ["-czf", archivePath, "-C", outputDir, `${artifactRoot}/${version}`], { stdio: "inherit" })
requireFile(archivePath, `Release archive was not created: ${archivePath}`)

rmSync(outputDir, { recursive: true, force: true })

console.log(`Created release archive at ${archivePath}`)