<script setup lang="ts">
import type { Report, Topic } from "@@/shared/types"
import ReportQueueItem from "./ReportQueueItem.vue"

type TopicScope = Pick<Topic, "id">
type ReportStage = { status: Report["status"], label: string, type: string }

const props = defineProps<{
    reports: Report[]
    topics?: TopicScope[]
}>()

const emit = defineEmits<{
    (event: "refresh"): void
}>()

const moderation = useModeration()

const reportStages = [
    { status: "pending", label: "Pending", type: "danger" },
    { status: "appealed", label: "Appealed", type: "info" },
    { status: "denied", label: "Denied", type: "danger" },
    { status: "closed", label: "Closed", type: "success" },
    { status: "removed", label: "Removed", type: "warning" },
] satisfies ReportStage[]

type ReportView = Report & {
    moderation: ReturnType<typeof moderation.forReport>
    stage: ReportStage
}

const selectedTopic = ref("")
const selectedStatus = ref<Report["status"] | undefined>("pending")
const reportViews = computed(() => props.reports.map(report => ({
    ...report,
    moderation: moderation.forReport(report, props.topics),
    stage: reportStages.find(stage => stage.status === report.status)!,
})))

const topicFilteredReports = computed(() => {
    if ((props.topics?.length ?? 0) <= 1 || !selectedTopic.value) return reportViews.value
    return reportViews.value.filter(report => report.moderation.topics.includes(selectedTopic.value))
})

const filteredReports = computed(() => {
    if (!selectedStatus.value) return []
    return topicFilteredReports.value.filter(report => report.status === selectedStatus.value)
})

function countReports(status: Report["status"]) {
    return topicFilteredReports.value.filter(report => report.status === status).length
}

function toggleStatus(status: Report["status"]) {
    if (selectedStatus.value === status) {
        selectedStatus.value = undefined
        return
    }
    selectedStatus.value = status
}

</script>

<template>
    <article class="column g-3">
        <header class="row wrap g-2">
            <template v-if="topics && topics.length > 1">
                <div class="field row topic-filter">
                    <select v-model="selectedTopic" aria-label="Filter reports by topic">
                        <option value="">All topics</option>
                        <option v-for="topic in topics" :key="topic.id" :value="topic.id">
                            {{ extractId(topic.id) }}
                        </option>
                    </select>
                </div>
            </template>
            <button
                v-for="stage in reportStages"
                :key="stage.status"
                type="button"
                class="f-1 b-0"
                :class="{ selected: selectedStatus === stage.status }"
                :aria-pressed="selectedStatus === stage.status"
                @click="toggleStatus(stage.status)"
            >
                <span>{{ stage.label }}</span>
                <span>{{ countReports(stage.status) }}</span>
            </button>
        </header>
        <section v-if="filteredReports.length" class="column g-2">
            <ReportQueueItem
                v-for="report in filteredReports"
                :key="report.id"
                :report="report"
                @refresh="emit('refresh')"
            />
        </section>
        <section v-else class="box empty-state">
            <p v-if="selectedStatus">There are no reports in this stage.</p>
            <p v-else>Select a status to view reports.</p>
        </section>
    </article>
</template>

<style scoped lang="scss">
.topic-filter select {
    min-width: 8.25rem;
    padding: 0.5rem 1rem;
    border: none;
    font-weight: var(--fw-bold);
    background-color: $white-2;
    cursor: pointer;
    transition:
        color var(--motion-duration-quick) var(--motion-easing-standard),
        background-color var(--motion-duration-quick) var(--motion-easing-standard);
}

.topic-filter select:hover {
    color: $white-0;
    background-color: $white-3;
}
</style>