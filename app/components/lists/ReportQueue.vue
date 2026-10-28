<script setup lang="ts">
import type { Report } from "@@/shared/types"

const props = defineProps<{
    reports: Report[]
    refresh: () => Promise<void>
    topic?: string
}>()

const hints = useHints()
const session = getSession()
const updatingSubjectId = ref<string>()
const resolvingSubjectId = ref<string>()
const resolutionAction = ref<"resolve" | "remove">()
const resolution = ref("")
const appealResolutions = ref<Record<string, string>>({})
const reasonVisibility = ref<Record<string, boolean>>({})

const reportStages = [
    { status: "pending", label: "Pending", type: "danger" },
    { status: "appealed", label: "Appealed", type: "info" },
    { status: "removed", label: "Removed", type: "warning" },
    { status: "approved", label: "Approved", type: "success" },
] satisfies { status: Report["status"], label: string, type: string }[]

const selectedStatus = ref<Report["status"] | "">("")
const filteredReports = computed(() => selectedStatus.value
    ? props.reports.filter(report => report.status === selectedStatus.value)
    : props.reports)

function countReports(status: Report["status"]) {
    return props.reports.filter(report => report.status === status).length
}

function toggleStatus(status: Report["status"]) {
    selectedStatus.value = selectedStatus.value === status ? "" : status
}

function showReasons(report: Report) {
    return reasonVisibility.value[report.id] ?? !report.resolution
}

function toggleReasons(report: Report) {
    reasonVisibility.value = {
        ...reasonVisibility.value,
        [report.id]: !showReasons(report),
    }
}

function isResolving(report: Report) {
    return resolvingSubjectId.value === report.id
}

function isUpdating(report: Report) {
    return updatingSubjectId.value === report.id
}

function isPending(report: Report) {
    return report.status === "pending"
}

function canActOnReport(report: Report) {
    return report.author.id !== session.user.id
}

function canReopen(report: Report) {
    return report.status === "approved" || report.status === "removed"
}

function canReviewAppeal(report: Report) {
    return report.status === "appealed"
        && !!report.appeal
        && !report.appeal.moderator
        && canActOnReport(report)
        && report.moderator?.id !== session.user.id
}

function viewSubject(report: Report) {
    navigateTo(`/${report.subject.id.replace(":", "/")}`)
}

async function resolveReport(report: Report, resolutionNote?: string) {
    if (updatingSubjectId.value || !canActOnReport(report)) return

    updatingSubjectId.value = report.id
    const reportId = extractId(report.id)
    const endpoint = props.topic
        ? `/api/topic/${encodeURIComponent(props.topic)}/reports/${reportId}/resolve`
        : `/api/report/${reportId}/resolve`
    const normalizedResolution = resolutionNote?.trim()

    try {
        await useApi(endpoint, {
            method: "POST",
            body: { ...(normalizedResolution ? { resolution: normalizedResolution } : {}) },
        })
        await props.refresh()
        hints.addSuccess(`Report for ${report.subject.id} approved.`)
        if (isResolving(report)) cancelResolution()
    }
    finally {
        updatingSubjectId.value = undefined
    }
}

async function removeReport(report: Report) {
    if (updatingSubjectId.value || !canActOnReport(report)) return

    updatingSubjectId.value = report.id
    const reportId = extractId(report.id)
    const endpoint = props.topic
        ? `/api/topic/${encodeURIComponent(props.topic)}/reports/${reportId}/remove`
        : `/api/report/${reportId}/remove`

    try {
        await useApi(endpoint, { method: "POST", body: { resolution: resolution.value.trim() } })
        await props.refresh()
        hints.addSuccess(`Report for ${report.subject.id} removed.`)
        cancelResolution()
    }
    finally {
        updatingSubjectId.value = undefined
    }
}

async function reopenReport(report: Report) {
    if (updatingSubjectId.value || !canActOnReport(report)) return

    updatingSubjectId.value = report.id
    const reportId = extractId(report.id)
    const endpoint = props.topic
        ? `/api/topic/${encodeURIComponent(props.topic)}/reports/${reportId}/reopen`
        : `/api/report/${reportId}/reopen`

    try {
        await useApi(endpoint, { method: "POST" })
        await props.refresh()
        hints.addSuccess(`Report for ${report.subject.id} reopened.`)
    }
    finally {
        updatingSubjectId.value = undefined
    }
}

function startResolution(report: Report) {
    if (!canActOnReport(report)) return
    resolution.value = ""
    resolvingSubjectId.value = report.id
    resolutionAction.value = "resolve"
}

function startRemoval(report: Report) {
    if (!canActOnReport(report)) return
    resolution.value = ""
    resolvingSubjectId.value = report.id
    resolutionAction.value = "remove"
}

function cancelResolution() {
    resolution.value = ""
    resolvingSubjectId.value = undefined
    resolutionAction.value = undefined
}

async function submitResolution(report: Report) {
    if (!canActOnReport(report)) return
    const note = resolution.value.trim()
    if (resolutionAction.value === "remove" && note.length < 3) {
        hints.addWarning("Removal notes must be at least 3 characters.")
        return
    }
    if (note.length > 0 && note.length < 3) {
        hints.addWarning("Resolution notes must be at least 3 characters.")
        return
    }

    if (resolutionAction.value === "remove") {
        await removeReport(report)
    }
    else {
        await resolveReport(report, note)
    }
}

async function reviewAppeal(report: Report, decision: "accept" | "reject") {
    if (updatingSubjectId.value || !canReviewAppeal(report)) return

    const note = appealResolutions.value[report.id]?.trim() ?? ""
    if (note.length < 3) {
        hints.addWarning("Appeal resolution notes must be at least 3 characters.")
        return
    }

    updatingSubjectId.value = report.id
    const reportId = extractId(report.id)
    const endpoint = props.topic
        ? `/api/topic/${encodeURIComponent(props.topic)}/reports/${reportId}/appeal/${decision}`
        : `/api/report/${reportId}/appeal/${decision}`

    try {
        await useApi(endpoint, { method: "POST", body: { resolution: note } })
        await props.refresh()
        hints.addSuccess(`Appeal for ${report.subject.id} ${decision}ed.`)
    }
    finally {
        updatingSubjectId.value = undefined
    }
}
</script>

<template>
    <article class="column g-3">
        <header class="row wrap g-2">
            <button
                v-for="stage in reportStages"
                :key="stage.status"
                type="button"
                class="f-1"
                :class="{ selected: selectedStatus === stage.status }"
                :aria-pressed="selectedStatus === stage.status"
                @click="toggleStatus(stage.status)"
            >
                <span>{{ stage.label }}</span>
                <span>{{ countReports(stage.status) }}</span>
            </button>
        </header>
        <section v-if="filteredReports.length" class="column g-2">
            <div v-for="report in filteredReports" :key="report.id" class="report box hover-shadow column g-2 p-3">
                <section class="row wrap g-1">
                    <template v-for="stage in reportStages" :key="stage.status">
                        <Tag v-if="report.status === stage.status" class="f-1" :type="stage.type" :label="stage.label" />
                    </template>
                    <Tag class="f-1" type="danger" :label="report.subject.id" @click="viewSubject(report)" />
                    <Tag class="f-1" type="danger" icon="fa-flag" :label="`${report.complaints.length} complaints`" />
                    <template v-if="report.complaints.length > 0">
                        <Tag class="danger" @click="toggleReasons(report)">
                            <i class="fa" :class="showReasons(report) ? 'fa-angles-up' : 'fa-angles-down'"></i>
                        </Tag>
                    </template>
                </section>
                <CollapseTransition>
                    <section v-show="showReasons(report)" class="f-1 column g-2">
                        <template v-for="(complaint, index) in report.complaints" :key="index">
                            <blockquote>
                                <strong>{{ complaint.reporter.name }}:</strong>
                                {{ complaint.reason }}
                            </blockquote>
                        </template>
                    </section>
                </CollapseTransition>
                <CollapseTransition mode="out-in" :speed="200">
                    <section v-if="isResolving(report) && canActOnReport(report)" class="field g-2">
                        <textarea v-model="resolution" :placeholder="resolutionAction === 'remove' ? 'Provide an removal reason...' : 'Provide an approval reason...'" rows="3" />
                        <div class="row g-2">
                            <ButtonSpinner class="small f-1" :loading="isUpdating(report)" @click="submitResolution(report)">
                                <i class="fa fa-check"></i>
                                <span>{{ resolutionAction === "remove" ? "Remove" : "Submit" }}</span>
                            </ButtonSpinner>
                            <button type="button" class="small f-1" :disabled="isUpdating(report)" @click="cancelResolution">
                                <i class="fa fa-ban"></i>
                                <span>Cancel</span>
                            </button>
                        </div>
                    </section>
                    <section v-if="report.appeal" class="column g-2">
                        <blockquote>
                            <strong>Appeal ({{ report.author }}):</strong>
                            {{ report.appeal.reason }}
                        </blockquote>
                        <blockquote v-if="report.resolution">
                            <strong>Resolution ({{ report.moderator?.name }}):</strong>
                            {{ report.resolution }}
                        </blockquote>
                        <template v-if="canReviewAppeal(report)">
                            <label class="field">
                                <textarea
                                    :value="appealResolutions[report.id] ?? ''"
                                    placeholder="Provide an appeal decision reason..."
                                    rows="3"
                                    @input="appealResolutions[report.id] = ($event.target as HTMLTextAreaElement).value"
                                />
                            </label>
                            <div class="row g-2">
                                <button type="button" class="small f-1" @click="viewSubject(report)">
                                    <i class="fa fa-eye"></i>
                                    <span>View</span>
                                </button>
                                <ButtonSpinner class="small f-1" :loading="isUpdating(report)" @click="reviewAppeal(report, 'accept')">
                                    <i class="fa-solid fa-check"></i>
                                    <span>Accept</span>
                                </ButtonSpinner>
                                <ButtonSpinner class="small f-1" :loading="isUpdating(report)" @click="reviewAppeal(report, 'reject')">
                                    <i class="fa-solid fa-xmark"></i>
                                    <span>Reject</span>
                                </ButtonSpinner>
                            </div>
                        </template>
                    </section>
                    <section v-if="canActOnReport(report) && isPending(report) && !isResolving(report)" class="row wrap g-1">
                        <button type="button" class="small f-1" :disabled="isUpdating(report)" @click="startResolution(report)">
                            <i class="fa fa-feather"></i>
                            <span>Approve</span>
                        </button>
                        <button type="button" class="small f-1" :disabled="isUpdating(report)" @click="startRemoval(report)">
                            <i class="fa fa-trash"></i>
                            Remove
                        </button>
                    </section>
                    <section v-if="canActOnReport(report) && canReopen(report) && !isResolving(report)" class="row">
                        <ButtonSpinner class="small f-1" :loading="isUpdating(report)" @click="reopenReport(report)">
                            <i class="fa fa-undo"></i>
                            <span>Reopen</span>
                        </ButtonSpinner>
                    </section>
                </CollapseTransition>
            </div>
        </section>
        <section v-else class="box empty-state">
            <p>{{ selectedStatus ? "There are no reports in this stage." : "There are currently no reports." }}</p>
        </section>
    </article>
</template>