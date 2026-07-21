import { chmodSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const artifactRoot = "forum"
const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"))
const artifactName = `${artifactRoot}-${packageJson.version}`
const outputServer = join(repoRoot, ".output", "server", "index.mjs")
const installerScript = join(repoRoot, "scripts", "installer.sh")
const releaseEnv = join(repoRoot, "scripts", "release.env")
const quickstart = join(repoRoot, "docs", "Quickstart.md")
const artifactDir = join(repoRoot, "dist", artifactRoot, packageJson.version)

function requireFile(path, message) {
    if (!existsSync(path)) {
        console.error(message)
        process.exit(1)
    }
}

requireFile(outputServer, "Missing .output/server/index.mjs. Run yarn build before staging a release.")
requireFile(installerScript, "Missing scripts/installer.sh.")
requireFile(releaseEnv, "Missing scripts/release.env.")
requireFile(quickstart, "Missing docs/Quickstart.md.")

rmSync(artifactDir, { recursive: true, force: true })
mkdirSync(artifactDir, { recursive: true })

cpSync(join(repoRoot, ".output"), artifactDir, { recursive: true })
cpSync(installerScript, join(artifactDir, "installer.sh"))
cpSync(releaseEnv, join(artifactDir, ".env.example"))
cpSync(quickstart, join(artifactDir, "Quickstart.md"))
chmodSync(join(artifactDir, "installer.sh"), 0o755)

requireFile(join(artifactDir, "installer.sh"), "Staged artifact is missing installer.sh.")
requireFile(join(artifactDir, ".env.example"), "Staged artifact is missing .env.example.")
requireFile(join(artifactDir, "Quickstart.md"), "Staged artifact is missing Quickstart.md.")
requireFile(join(artifactDir, "server", "index.mjs"), "Staged artifact is missing server/index.mjs.")

console.log(`Staged release artifact contents in ${artifactDir}`)
console.log(`Archive with: tar -czf ${artifactName}.tar.gz -C dist ${artifactRoot}/${packageJson.version}`)