import { existsSync } from "node:fs"
import { readdir, readFile, stat } from "node:fs/promises"
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const defaultRepositoryRoot = resolve(scriptDirectory, "..")
const expectedSections = [
    "Status",
    "Dependencies",
    "Goal",
    "Requirements",
    "Tasks",
    "Notes",
    "Relevant Files",
    "Progress Log",
]
const requiredSections = [
    "Status",
    "Goal",
    "Requirements",
    "Tasks",
    "Notes",
    "Relevant Files",
    "Progress Log",
]
const laneNames = ["In Progress", "Paused", "Blocked", "Planned", "Backlog", "Completed", "Invalid"]

function usage() {
    return "Usage: yarn standup [--focus all|active|backlog|priority|cleanup|dependencies] [--ticket NNNN] [--priority High|Medium|Low] [--limit 1-50] [--repository-root <path>]"
}

function parseArguments(args) {
    let repositoryRoot = defaultRepositoryRoot
    let limit = 5
    let focus = "all"
    let focusExplicit = false
    let ticketId
    let priority

    for (let index = 0; index < args.length; index += 1) {
        const argument = args[index]

        if (argument === "--help" || argument === "-h") {
            return { help: true }
        }

        if (argument === "--limit" || argument === "-Limit") {
            const value = args[index + 1]
            if (!value || value.startsWith("-") || !/^\d+$/.test(value)) {
                throw new Error(`Invalid limit.\n${usage()}`)
            }
            limit = Number(value)
            index += 1
        } else if (argument.startsWith("--limit=")) {
            const value = argument.slice("--limit=".length)
            if (!/^\d+$/.test(value)) {
                throw new Error(`Invalid limit.\n${usage()}`)
            }
            limit = Number(value)
        } else if (argument === "--focus" || argument === "-Focus") {
            const value = args[index + 1]
            if (!value || value.startsWith("-")) {
                throw new Error(`Missing focus.\n${usage()}`)
            }
            focus = value.toLowerCase()
            focusExplicit = true
            index += 1
        } else if (argument.startsWith("--focus=")) {
            focus = argument.slice("--focus=".length).toLowerCase()
            focusExplicit = true
        } else if (argument === "--ticket" || argument === "-Ticket") {
            const value = args[index + 1]
            if (!value || value.startsWith("-") || !/^\d{1,4}$/.test(value)) {
                throw new Error(`Invalid ticket ID.\n${usage()}`)
            }
            ticketId = value.padStart(4, "0")
            index += 1
        } else if (argument.startsWith("--ticket=")) {
            const value = argument.slice("--ticket=".length)
            if (!/^\d{1,4}$/.test(value)) {
                throw new Error(`Invalid ticket ID.\n${usage()}`)
            }
            ticketId = value.padStart(4, "0")
        } else if (argument === "--priority" || argument === "-Priority") {
            const value = args[index + 1]
            if (!value || value.startsWith("-")) {
                throw new Error(`Missing priority.\n${usage()}`)
            }
            priority = value
            index += 1
        } else if (argument.startsWith("--priority=")) {
            priority = argument.slice("--priority=".length)
        } else if (argument === "--repository-root" || argument === "-RepositoryRoot") {
            const value = args[index + 1]
            if (!value || value.startsWith("-")) {
                throw new Error(`Missing repository root.\n${usage()}`)
            }
            repositoryRoot = value
            index += 1
        } else if (argument.startsWith("--repository-root=")) {
            repositoryRoot = argument.slice("--repository-root=".length)
            if (!repositoryRoot) {
                throw new Error(`Missing repository root.\n${usage()}`)
            }
        } else {
            throw new Error(`Unknown argument: ${argument}\n${usage()}`)
        }
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
        throw new Error(`Invalid limit.\n${usage()}`)
    }

    const validFocuses = ["all", "active", "backlog", "priority", "cleanup", "dependencies"]
    if (!validFocuses.includes(focus)) {
        throw new Error(`Invalid focus '${focus}'.\n${usage()}`)
    }

    const normalizedPriority = ["High", "Medium", "Low"]
        .find(value => value.toLowerCase() === priority?.toLowerCase())
    if (priority && !normalizedPriority) {
        throw new Error(`Invalid priority '${priority}'.\n${usage()}`)
    }
    if (ticketId && (focusExplicit || priority)) {
        throw new Error(`--ticket cannot be combined with --focus or --priority.\n${usage()}`)
    }
    if (normalizedPriority && ["cleanup", "dependencies"].includes(focus)) {
        throw new Error(`--priority cannot be used with --focus ${focus}.\n${usage()}`)
    }

    return {
        focus,
        help: false,
        limit,
        priority: normalizedPriority,
        repositoryRoot,
        ticketId,
    }
}

function getSectionContent(text, name) {
    const lines = text.split(/\r?\n/)
    const headingPattern = /^##\s+(.+?)\s*$/
    const start = lines.findIndex(line => {
        const match = line.match(headingPattern)
        return match && match[1] === name
    })

    if (start < 0) return ""

    let end = lines.length
    for (let index = start + 1; index < lines.length; index += 1) {
        if (/^##\s+/.test(lines[index])) {
            end = index
            break
        }
    }

    return lines.slice(start + 1, end).join("\n")
}

function getStatusField(status, name) {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const match = status.match(new RegExp(`^- ${escapedName}:\\s*(.*?)\\s*$`, "m"))
    return match ? match[1].trim().replace(/^`|`$/g, "") : ""
}

function getDependencies(text) {
    const dependencies = []
    const invalidEntries = []
    const dependencyPattern = /^\s*-\s+\[(\d+)\]\(([^)]+)\):\s*(.*)$/

    for (const line of text.split(/\r?\n/)) {
        if (!/^\s*-\s+\[/.test(line)) continue
        const match = line.match(dependencyPattern)
        if (!match) {
            invalidEntries.push(line.trim())
            continue
        }

        dependencies.push({
            id: match[1],
            path: match[2],
            reason: match[3],
        })
    }

    return { dependencies, invalidEntries }
}

function getChecklistItems(section) {
    return [...section.matchAll(/^\s*[-*]\s+\[(?<checked>[ xX])\]\s*(?<text>[^\r\n]+)/gm)]
        .map(match => ({
            checked: match.groups.checked.toLowerCase() === "x",
            text: match.groups.text.trim(),
        }))
}

function parseTicket(file, ticketsRoot, text) {
    const heading = text.match(/^# Ticket (?<id>\d+):\s*(?<title>.+)$/m)
    if (!heading) return null

    const id = heading.groups.id
    const filename = basename(file).match(/^(?<id>\d{4})-.+\.md$/)
    const relativeDirectory = relative(ticketsRoot, dirname(file))
    const folder = relativeDirectory ? relativeDirectory.split(/[\\/]/)[0] : "root"
    const statusSection = getSectionContent(text, "Status")
    const dependencyData = getDependencies(getSectionContent(text, "Dependencies"))
    const headings = [...text.matchAll(/^##\s+(.+?)\s*$/gm)].map(match => match[1].trim())
    const missingSections = requiredSections.filter(section => !headings.includes(section))
    const presentExpected = expectedSections.filter(section => headings.includes(section))
    const actualExpected = headings.filter(section => expectedSections.includes(section))
    const notesIndex = headings.indexOf("Notes")
    const relevantFilesIndex = headings.indexOf("Relevant Files")
    const unexpectedSections = headings.filter((section, index) => (
        !expectedSections.includes(section)
        && (notesIndex < 0 || index <= notesIndex || relevantFilesIndex <= index)
    ))
    const progressSection = getSectionContent(text, "Progress Log")
    const progressEntries = [...progressSection.matchAll(/^\s*- (\d{4}-\d{2}-\d{2}):([^\r\n]*)/gm)]
    const progressDates = progressEntries.map(match => match[1])
    let progressOrderValid = true
    for (let index = 1; index < progressDates.length; index += 1) {
        if (progressDates[index] > progressDates[index - 1]) {
            progressOrderValid = false
            break
        }
    }

    const requirements = getChecklistItems(getSectionContent(text, "Requirements"))
    const tasks = getChecklistItems(getSectionContent(text, "Tasks"))
    return {
        id,
        filenameId: filename ? filename.groups.id : "",
        title: heading.groups.title.trim(),
        file,
        folder,
        state: getStatusField(statusSection, "State"),
        priority: getStatusField(statusSection, "Priority"),
        next: getStatusField(statusSection, "Next"),
        dependencies: dependencyData.dependencies,
        invalidDependencyEntries: dependencyData.invalidEntries,
        lane: getLane(getStatusField(statusSection, "State"), folder),
        missingSections,
        unexpectedSections,
        sectionOrderValid: presentExpected.join("|") === actualExpected.join("|"),
        progressOrderValid,
        latestProgress: progressEntries[0] ? progressEntries[0][0].trim() : "",
        requirements,
        tasks,
        uncheckedRequirements: requirements.filter(item => !item.checked).map(item => item.text),
        uncheckedTasks: tasks.filter(item => !item.checked).map(item => item.text),
        pendingDependencies: [],
        issues: [],
    }
}

function getLane(state, folder) {
    if (["In Progress", "Paused", "Blocked", "Completed"].includes(state)) return state
    if (state === "Planned") {
        if (folder === "root") return "Planned"
        if (folder === "backlog") return "Backlog"
        return "Invalid"
    }
    return "Invalid"
}

async function getMarkdownFiles(directory) {
    const files = []
    const entries = await readdir(directory, { withFileTypes: true })
    entries.sort((first, second) => first.name.localeCompare(second.name))

    for (const entry of entries) {
        const entryPath = join(directory, entry.name)
        if (entry.isDirectory()) {
            files.push(...await getMarkdownFiles(entryPath))
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md") && entry.name.toLowerCase() !== "_template.md") {
            files.push(entryPath)
        }
    }

    return files
}

function getRelativeTicketPath(ticketsRoot, file) {
    return relative(ticketsRoot, file).split(sep).join("/")
}

function pathsEqual(first, second) {
    const normalizedFirst = resolve(first)
    const normalizedSecond = resolve(second)
    return process.platform === "win32"
        ? normalizedFirst.toLowerCase() === normalizedSecond.toLowerCase()
        : normalizedFirst === normalizedSecond
}

function addTicketIssues(ticket, ticketsById, duplicateIds) {
    if (!ticket.filenameId) {
        ticket.issues.push("filename must start with a four-digit ticket ID and slug")
    } else if (ticket.filenameId !== ticket.id) {
        ticket.issues.push(`filename ID '${ticket.filenameId}' does not match heading ID '${ticket.id}'`)
    }
    if (duplicateIds.has(ticket.id)) {
        ticket.issues.push(`duplicate ticket ID '${ticket.id}' appears in ${duplicateIds.get(ticket.id)} files`)
    }
    if (!ticket.state) ticket.issues.push("missing State")
    else if (!["Planned", "In Progress", "Paused", "Blocked", "Completed"].includes(ticket.state)) {
        ticket.issues.push(`invalid State '${ticket.state}'`)
    }
    if (!ticket.priority) ticket.issues.push("missing Priority")
    else if (!["High", "Medium", "Low"].includes(ticket.priority)) {
        ticket.issues.push(`invalid Priority '${ticket.priority}'`)
    }
    if (!ticket.next) ticket.issues.push("missing Next")
    else if (ticket.state === "Completed" && ticket.next !== "None") {
        ticket.issues.push("completed ticket should use Next: None")
    } else if (ticket.state !== "Completed" && ticket.next === "None") {
        ticket.issues.push("unfinished ticket needs Next step")
    }
    if (!["root", "backlog", "completed"].includes(ticket.folder)) {
        ticket.issues.push(`unexpected folder '${ticket.folder}'`)
    }
    if (ticket.folder === "completed" && ticket.state !== "Completed") {
        ticket.issues.push("completed folder has unfinished state")
    }
    if (ticket.folder !== "completed" && ticket.state === "Completed") {
        ticket.issues.push("completed but outside folder")
    }
    if (ticket.missingSections.length) {
        ticket.issues.push(`missing sections: ${ticket.missingSections.join(", ")}`)
    }
    if (ticket.unexpectedSections.length) {
        ticket.issues.push(`unexpected sections: ${ticket.unexpectedSections.join(", ")}`)
    }
    if (!ticket.sectionOrderValid) ticket.issues.push("sections are in wrong order")
    if (!ticket.progressOrderValid) ticket.issues.push("progress log is not newest first")
    if (ticket.state === "Completed" && ticket.uncheckedRequirements.length) {
        ticket.issues.push(`completed ticket has unchecked Requirements: ${ticket.uncheckedRequirements.join("; ")}`)
    }
    if (ticket.state === "Completed" && ticket.uncheckedTasks.length) {
        ticket.issues.push(`completed ticket has unchecked Tasks: ${ticket.uncheckedTasks.join("; ")}`)
    }
    for (const entry of ticket.invalidDependencyEntries) {
        ticket.issues.push(`invalid dependency entry: ${entry}`)
    }

    for (const dependency of ticket.dependencies) {
        if (isAbsolute(dependency.path) || /^[A-Za-z]:[\\/]/.test(dependency.path)) {
            ticket.issues.push(`dependency path must be relative: ${dependency.path}`)
            continue
        }

        const normalizedPath = dependency.path.replace(/[\\/]/g, sep)
        const dependencyPath = resolve(dirname(ticket.file), normalizedPath)
        if (!existsSync(dependencyPath)) {
            ticket.issues.push(`dependency link target does not exist: ${dependency.path}`)
        } else if (ticketsById.has(dependency.id)) {
            const expectedPath = ticketsById.get(dependency.id).file
            if (!pathsEqual(dependencyPath, expectedPath)) {
                ticket.issues.push(`dependency link path does not point to ticket '${dependency.id}': ${dependency.path}`)
            }
        }
    }
}

function findDependencyCycles(tickets, ticketsById, duplicateIds) {
    const visitState = new Map()
    const cycles = []

    function visit(id, path) {
        if (path.includes(id)) {
            cycles.push([...path, id].join(" -> "))
            return
        }
        if (visitState.get(id) === "Done") return

        visitState.set(id, "Visiting")
        const nextPath = [...path, id]
        for (const dependency of ticketsById.get(id).dependencies) {
            if (ticketsById.has(dependency.id) && !duplicateIds.has(dependency.id)) {
                visit(dependency.id, nextPath)
            }
        }
        visitState.set(id, "Done")
    }

    for (const ticket of tickets) visit(ticket.id, [])
    return [...new Set(cycles)]
}

function getCandidates(tickets, duplicateIds, selectedPriority) {
    const rootPlanned = tickets.filter(ticket => (
        ticket.folder === "root"
        && ticket.state === "Planned"
        && !duplicateIds.has(ticket.id)
    ))
    const readyCandidates = rootPlanned.filter(ticket => ticket.pendingDependencies.length === 0)
    const priorities = selectedPriority ? [selectedPriority] : ["High", "Medium"]

    for (const priority of priorities) {
        const matching = readyCandidates.filter(ticket => ticket.priority === priority)
        if (matching.length) return { priority, tickets: matching }
    }
    for (const priority of priorities) {
        const matching = rootPlanned.filter(ticket => ticket.priority === priority)
        if (matching.length) return { priority, tickets: matching }
    }
    return { priority: selectedPriority, tickets: [] }
}

function printPriorityCounts(tickets) {
    const priorityBuckets = [
        ["Active/root", tickets.filter(ticket => ticket.folder === "root" && ["Planned", "In Progress"].includes(ticket.state))],
        ["Paused", tickets.filter(ticket => ticket.state === "Paused")],
        ["Blocked", tickets.filter(ticket => ticket.state === "Blocked")],
        ["Backlog", tickets.filter(ticket => ticket.folder === "backlog" && ticket.state === "Planned")],
        ["Completed", tickets.filter(ticket => ticket.state === "Completed")],
    ]
    console.log("Priority counts (High/Medium/Low):")
    for (const [name, bucket] of priorityBuckets) {
        const counts = ["High", "Medium", "Low"]
            .map(priority => `${priority}=${bucket.filter(ticket => ticket.priority === priority).length}`)
        console.log(`  ${name}: ${counts.join(", ")}`)
    }
}

function printCurrentWork(tickets, selectedPriority) {
    console.log("Current work:")
    const currentWork = tickets
        .filter(ticket => (
            ["In Progress", "Paused", "Blocked"].includes(ticket.state)
            && (!selectedPriority || ticket.priority === selectedPriority)
        ))
        .sort((first, second) => Number(first.id) - Number(second.id))
    if (!currentWork.length) console.log("  None")
    for (const ticket of currentWork) {
        const progress = ticket.latestProgress ? `; latest: ${ticket.latestProgress}` : ""
        console.log(`  ${ticket.id} [${ticket.state}, ${ticket.priority}] ${ticket.title} | Next: ${ticket.next}${progress}`)
    }
}

function printNextWork(tickets, duplicateIds, selectedPriority, limit) {
    const selection = getCandidates(tickets, duplicateIds, selectedPriority)
    console.log("Next work candidates (root planned):")
    if (!selection.tickets.length) {
        const priorityNote = selectedPriority
            ? `None at ${selectedPriority} priority`
            : "None at High or Medium priority; use --priority Low to include lower-priority work"
        console.log(`  ${priorityNote}`)
        return
    }

    const shownCandidates = [...selection.tickets]
        .sort((first, second) => Number(first.id) - Number(second.id))
        .slice(0, limit)
    console.log(`  ${selection.priority} priority; showing ${shownCandidates.length} of ${selection.tickets.length}`)
    for (const ticket of shownCandidates) {
        const dependencyNote = ticket.pendingDependencies.length
            ? ` | prerequisite pending: ${ticket.pendingDependencies.map(dependency => dependency.id).join(", ")}`
            : ""
        console.log(`  ${ticket.id} ${ticket.title} | Next: ${ticket.next}${dependencyNote}`)
    }
}

function printBacklog(tickets, selectedPriority, limit) {
    const priorityOrder = new Map([["High", 0], ["Medium", 1], ["Low", 2]])
    const backlog = tickets
        .filter(ticket => (
            ticket.folder === "backlog"
            && ticket.state === "Planned"
            && (!selectedPriority || ticket.priority === selectedPriority)
        ))
        .sort((first, second) => (
            priorityOrder.get(first.priority) - priorityOrder.get(second.priority)
            || Number(first.id) - Number(second.id)
        ))
    const shownBacklog = backlog.slice(0, limit)

    console.log("Backlog tickets:")
    if (!backlog.length) {
        console.log("  None")
        return
    }

    console.log(`  Showing ${shownBacklog.length} of ${backlog.length}`)
    for (const ticket of shownBacklog) {
        const dependencyNote = ticket.pendingDependencies.length
            ? ` | prerequisites pending: ${ticket.pendingDependencies.map(dependency => dependency.id).join(", ")}`
            : ""
        console.log(`  ${ticket.id} [${ticket.priority}] ${ticket.title} | Next: ${ticket.next}${dependencyNote}`)
    }
}

function printCleanup(tickets, unparsedFiles, ticketsRoot) {
    console.log("Cleanup:")
    const qualityIssues = tickets.filter(ticket => ticket.issues.length)
    if (!qualityIssues.length && !unparsedFiles.length) console.log("  None")
    for (const ticket of qualityIssues) {
        console.log(`  ${ticket.id}: ${ticket.issues.join("; ")}`)
    }
    for (const file of unparsedFiles) {
        console.log(`  Unparsed ticket file: ${getRelativeTicketPath(ticketsRoot, file)}`)
    }
}

function getDependencyWarnings(tickets, ticketsById, duplicateIds) {
    const dependencyWarnings = []
    for (const ticket of tickets) {
        for (const dependency of ticket.dependencies) {
            if (dependency.id === ticket.id) {
                dependencyWarnings.push(`${ticket.id} depends on itself`)
            } else if (duplicateIds.has(dependency.id)) {
                dependencyWarnings.push(`${ticket.id} depends on ambiguous ID ${dependency.id} (duplicate ticket IDs)`)
            } else if (!ticketsById.has(dependency.id)) {
                dependencyWarnings.push(`${ticket.id} has unknown dependency ${dependency.id}`)
            } else if (ticketsById.get(dependency.id).state !== "Completed") {
                dependencyWarnings.push(`${ticket.id} depends on ${dependency.id} (${ticketsById.get(dependency.id).state})`)
            }
        }
    }
    dependencyWarnings.push(...findDependencyCycles(tickets, ticketsById, duplicateIds).map(cycle => `dependency cycle: ${cycle}`))
    return [...new Set(dependencyWarnings)]
}

function printDependencyWarnings(tickets, ticketsById, duplicateIds) {
    console.log("Dependency warnings:")
    const warnings = getDependencyWarnings(tickets, ticketsById, duplicateIds)
    if (!warnings.length) console.log("  None")
    for (const warning of warnings) console.log(`  ${warning}`)
}

function printChecklist(title, items) {
    console.log(`${title}:`)
    if (!items.length) {
        console.log("  None")
        return
    }
    for (const item of items) {
        console.log(`  [${item.checked ? "x" : " "}] ${item.text}`)
    }
}

function printTicketDetail(ticket, ticketsRoot, ticketsById, duplicateIds) {
    console.log(`Ticket ${ticket.id}: ${ticket.title}`)
    console.log(`  File: ${getRelativeTicketPath(ticketsRoot, ticket.file)}`)
    console.log(`  State: ${ticket.state || "(missing)"} | Priority: ${ticket.priority || "(missing)"}`)
    console.log(`  Next: ${ticket.next || "(missing)"}`)
    console.log("Dependencies:")
    if (!ticket.dependencies.length) {
        console.log("  None recorded")
    } else {
        for (const dependency of ticket.dependencies) {
            let state = "unknown"
            if (duplicateIds.has(dependency.id)) state = "duplicate ID"
            else if (ticketsById.has(dependency.id)) state = ticketsById.get(dependency.id).state
            console.log(`  ${dependency.id} [${state}] ${dependency.reason}`)
        }
    }
    printChecklist("Requirements", ticket.requirements)
    printChecklist("Tasks", ticket.tasks)
    if (ticket.latestProgress) console.log(`Latest progress: ${ticket.latestProgress}`)
    if (ticket.issues.length) console.log(`Issues: ${ticket.issues.join("; ")}`)
}

function printTicket(tickets, ticketId, ticketsRoot, ticketsById, duplicateIds) {
    const matches = tickets.filter(ticket => ticket.id === ticketId)
    if (!matches.length) throw new Error(`Ticket ${ticketId} was not found.`)
    if (matches.length > 1) {
        const paths = matches.map(ticket => getRelativeTicketPath(ticketsRoot, ticket.file)).join(", ")
        throw new Error(`Ticket ID ${ticketId} is ambiguous: ${paths}`)
    }
    printTicketDetail(matches[0], ticketsRoot, ticketsById, duplicateIds)
}

function printReport({
    files,
    tickets,
    unparsedFiles,
    ticketsById,
    duplicateIds,
    limit,
    ticketsRoot,
    focus,
    priority,
    ticketId,
}) {
    if (ticketId) {
        printTicket(tickets, ticketId, ticketsRoot, ticketsById, duplicateIds)
        return
    }

    const showAll = focus === "all"
    if (showAll) {
        console.log("ClassicForum ticket snapshot (counts come from ticket files, not an external tracker)")
        console.log(`Ticket files scanned: ${files.length}; parsed: ${tickets.length}`)
        console.log("Lane counts:")
        for (const lane of laneNames) {
            const count = tickets.filter(ticket => ticket.lane === lane).length
            if (count > 0) console.log(`  ${lane}: ${count}`)
        }
    }

    if (showAll || focus === "priority") printPriorityCounts(tickets)
    if (showAll || focus === "active") {
        printCurrentWork(tickets, priority)
        printNextWork(tickets, duplicateIds, priority, limit)
    } else if (focus === "priority") {
        printNextWork(tickets, duplicateIds, priority, limit)
    }
    if (focus === "backlog") printBacklog(tickets, priority, limit)
    if (showAll || focus === "cleanup") printCleanup(tickets, unparsedFiles, ticketsRoot)
    if (showAll || focus === "dependencies") printDependencyWarnings(tickets, ticketsById, duplicateIds)
}

async function main() {
    const options = parseArguments(process.argv.slice(2))
    if (options.help) {
        console.log(usage())
        return
    }

    const repositoryPath = resolve(options.repositoryRoot)
    const ticketsRoot = join(repositoryPath, "docs", "tickets")
    try {
        const directory = await stat(ticketsRoot)
        if (!directory.isDirectory()) throw new Error(`Ticket directory not found: ${ticketsRoot}`)
    } catch (error) {
        if (error.code === "ENOENT" || error.code === "ENOTDIR") {
            throw new Error(`Ticket directory not found: ${ticketsRoot}`)
        }
        throw error
    }

    const files = await getMarkdownFiles(ticketsRoot)
    const tickets = []
    const unparsedFiles = []
    for (const file of files) {
        const text = await readFile(file, "utf8")
        const ticket = parseTicket(file, ticketsRoot, text)
        if (ticket) tickets.push(ticket)
        else unparsedFiles.push(file)
    }

    const duplicateIds = new Map()
    const groupedTickets = new Map()
    for (const ticket of tickets) {
        groupedTickets.set(ticket.id, (groupedTickets.get(ticket.id) ?? 0) + 1)
    }
    for (const [id, count] of groupedTickets) {
        if (count > 1) duplicateIds.set(id, count)
    }

    const ticketsById = new Map()
    for (const ticket of tickets) {
        if (!ticketsById.has(ticket.id)) ticketsById.set(ticket.id, ticket)
    }
    for (const ticket of tickets) {
        ticket.pendingDependencies = ticket.dependencies.filter(dependency => (
            duplicateIds.has(dependency.id)
            || !ticketsById.has(dependency.id)
            || ticketsById.get(dependency.id).state !== "Completed"
        ))
        addTicketIssues(ticket, ticketsById, duplicateIds)
    }

    printReport({
        files,
        tickets,
        unparsedFiles,
        ticketsById,
        duplicateIds,
        limit: options.limit,
        ticketsRoot,
        focus: options.focus,
        priority: options.priority,
        ticketId: options.ticketId,
    })
}

main().catch(error => {
    console.error(error.message)
    process.exitCode = 1
})
