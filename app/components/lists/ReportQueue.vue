<script setup lang="ts">
import type { Report } from "@@/shared/types"

const props = defineProps<{
    reports: Report[]
    refresh: () => Promise<void>
    topic?: string
}>()

const hints = useHints()
const updatingSubjectId = ref<string>()
const resolvingSubjectId = ref<string>()
const resolution = ref("")
const reasonVisibility = ref<Record<string, boolean>>({})

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

function canReopen(report: Report) {
    return report.status === "resolved" || report.status === "removed"
}

function viewSubject(report: Report) {
    navigateTo(`/${report.subject.id.replace(":", "/")}`)
}

async function updateStatus(report: Report, status: Report["status"], resolutionNote?: string) {
    if (updatingSubjectId.value) return false

    updatingSubjectId.value = report.id
    const reportId = extractId(report.id)
    const endpoint = props.topic
        ? `/api/topic/${encodeURIComponent(props.topic)}/reports/${reportId}/update`
        : `/api/report/${reportId}/update`
    const normalizedResolution = resolutionNote?.trim()

    try {
        await useApi(endpoint, {
            method: "PUT",
            body: { status, ...(normalizedResolution ? { resolution: normalizedResolution } : {}) },
        })
        await props.refresh()
        hints.addSuccess(`Report for ${report.subject.id} marked ${status}.`)
        if (isResolving(report)) cancelResolution()
        return true
    }
    finally {
        updatingSubjectId.value = undefined
    }
}

function startResolution(report: Report) {
    resolution.value = ""
    resolvingSubjectId.value = report.id
}

function cancelResolution() {
    resolution.value = ""
    resolvingSubjectId.value = undefined
}

async function submitResolution(report: Report) {
    const note = resolution.value.trim()
    if (note.length > 0 && note.length < 3) {
        hints.addError("Resolution notes must be at least 3 characters.")
        return
    }

    await updateStatus(report, "resolved", note)
}
</script>

<template>
    <section v-if="reports.length" class="column g-2">
        <article v-for="report in reports" :key="report.id" class="report box background">
            <div class="main box column g-2 p-3">
                <div class="row wrap g-1">
                    <Tag v-if="isPending(report)" class="f-1" type="danger" label="Pending" />
                    <Tag v-else-if="report.status === 'resolved'" class="f-1" type="success" label="Resolved" />
                    <Tag v-else class="f-1" type="warning" label="Removed" />
                    <Tag class="f-1" type="danger" :label="report.subject.id" @click="viewSubject(report)" />
                    <Tag class="f-1" type="info" icon="fa-flag" :label="`${report.complaints.length} complaints`" />
                </div>
                <CollapseTransition>
                    <div v-show="showReasons(report)" :id="`report-reasons-${report.id}`" class="column g-2">
                        <div v-for="(complaint, index) in report.complaints" :key="index">
                            <div class="mb-2">
                                    <p>{{ complaint.reason === "NONE" ? "No reason provided." : complaint.reason }}</p>
                            </div>
                            <div class="row g-1">
                                <DurationTag :time="complaint.time" />
                                <UserTag :user="complaint.reporter" />
                            </div>
                        </div>
                    </div>
                </CollapseTransition>
                <p v-if="report.resolution" class="resolution">{{ report.resolution }}</p>
                <label v-if="isResolving(report)" class="field column g-1 mb-2">
                    <textarea v-model="resolution" placeholder="Provide a resolution decision..." rows="3" />
                </label>
                <div class="actions row wrap g-1">
                    <button v-if="isPending(report)" type="button" class="small" @click="viewSubject(report)">
                        <i class="fa fa-eye"></i>
                        <span>Review</span>
                    </button>
                    <button v-if="isPending(report) && !isResolving(report)" type="button" class="small" :disabled="isUpdating(report)" @click="startResolution(report)">
                        <i class="fa fa-feather"></i>
                        <span>Resolve</span>
                    </button>
                    <ButtonSpinner v-if="isPending(report) && !isResolving(report)" class="small" :loading="isUpdating(report)" @click="updateStatus(report, 'removed')">
                        <i class="fa fa-trash"></i>
                        Remove
                    </ButtonSpinner>
                    <ButtonSpinner v-if="isResolving(report)" class="small" :loading="isUpdating(report)" @click="submitResolution(report)">
                        <i class="fa fa-check"></i>
                        <span>Submit</span>
                    </ButtonSpinner>
                    <button v-if="isResolving(report)" type="button" class="small" :disabled="isUpdating(report)" @click="cancelResolution">
                        <i class="fa fa-times"></i>
                        <span>Cancel</span>
                    </button>
                    <ButtonSpinner v-if="canReopen(report) && !isResolving(report)" class="small" :loading="isUpdating(report)" @click="updateStatus(report, 'pending')">
                        <i class="fa fa-undo"></i>
                        <span>Reopen</span>
                    </ButtonSpinner>
                    <button
                        v-if="report.complaints.length > 0"
                        type="button"
                        class="small"
                        :aria-label="showReasons(report) ? 'Hide reasons' : 'Show reasons'"
                        :aria-expanded="showReasons(report)"
                        :aria-controls="`report-reasons-${report.id}`"
                        @click="toggleReasons(report)"
                    >
                        <i class="fa" :class="showReasons(report) ? 'fa-angles-up' : 'fa-angles-down'"></i>
                    </button>
                </div>
            </div>
        </article>
    </section>
    <section v-else class="box p-3 text center">
        <p>There are currently no reports.</p>
    </section>
</template>

<style scoped lang="scss">
article.report {
    &:hover {
        @include shadow(1px, $blur: 0.25rem, $spread: 0.25rem, $color: #CCC1);
    }

    .main {
        overflow: hidden;
    }

    p.resolution {
        font-style: italic;
    }
}
</style>