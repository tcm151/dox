import { writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { parseTestArguments } from "./options.mjs"
import { cleanupTestOutputFolders } from "./server.mjs"
import { runTests } from "./runner.mjs"
import { formatPlaywrightTraceReport, inspectPlaywrightTrace } from "./trace.mjs"

const projectRoot = process.cwd()
const options = parseTestArguments(process.argv.slice(2), projectRoot)

if (options.inspectTracePath) {
    const archivePath = resolve(projectRoot, options.inspectTracePath)
    const report = formatPlaywrightTraceReport(await inspectPlaywrightTrace(archivePath))
    if (options.traceReportPath) {
        const outputPath = resolve(projectRoot, options.traceReportPath)
        if (outputPath === archivePath) {
            throw new Error("The trace report path must not overwrite the Playwright trace archive.")
        }
        await writeFile(outputPath, report, "utf8")
        console.log(`[trace report] ${outputPath}`)
    }
    console.log(report)
}
else if (options.cleanup) {
    const removedFolders = await cleanupTestOutputFolders(projectRoot)
    const folderLabel = removedFolders.length === 1 ? "folder" : "folders"
    console.log(removedFolders.length
        ? `[test cleanup] Removed ${removedFolders.length} leftover test output ${folderLabel}.`
        : "[test cleanup] No leftover test output folders found.")
}
else {
    await runTests({ projectRoot, options })
}
