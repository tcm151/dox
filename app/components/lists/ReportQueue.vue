<script setup lang="ts">
import type { Report } from "@@/shared/types"
import ReportQueueItem from "./ReportQueueItem.vue"

const props = defineProps<{
    reports: Report[]
    topics?: string[]
}>()

const emit = defineEmits<{
    (event: "refresh"): void
}>()

const reportStatuses: { status: Report["status"], label: string }[] = [
    { status: "pending", label: "Pending" },
    { status: "appealed", label: "Appealed" },
    { status: "denied", label: "Denied" },
    { status: "closed", label: "Closed" },
    { status: "removed", label: "Removed" },
]

const selectedTopic = ref("")
const selectedStatus = ref<Report["status"]>("pending")

const topicReports = computed(() => selectedTopic.value
    ? props.reports.filter(report => report.topics.includes(selectedTopic.value))
    : props.reports)

const filteredReports = computed(() => {
    return topicReports.value.filter(report => report.status === selectedStatus.value)
        .sort((left, right) => Number(right.priority ?? false) - Number(left.priority ?? false))
})

function statusCount(status: Report["status"]) {
    return topicReports.value.filter(report => report.status === status).length
}

watchEffect(() => {
    if (selectedTopic.value && !props.topics?.includes(selectedTopic.value)) {
        selectedTopic.value = ""
    }

    if (!statusCount(selectedStatus.value)) {
        selectedStatus.value = reportStatuses.find(stage => statusCount(stage.status))?.status ?? "pending"
    }
})

</script>

<template>
    <section class="column g-3">
        <header class="row wrap g-2">
            <template v-if="topics && topics.length">
                <div class="field row topic-filter">
                    <select v-model="selectedTopic">
                        <option value="">All Topics</option>
                        <template v-for="topic in topics" :key="topic">
                            <option :value="topic">{{ extractId(topic) }}</option>
                        </template>
                    </select>
                </div>
            </template>
            <template v-for="stage in reportStatuses" :key="stage.status">
                <button v-if="statusCount(stage.status)" type="button" class="f-1" :class="{ selected: selectedStatus === stage.status }" @click="selectedStatus = stage.status">
                    <span>{{ stage.label }}</span>
                    <span>{{ statusCount(stage.status) }}</span>
                </button>
            </template>
        </header>
        <section v-if="filteredReports.length" class="column g-2">
            <template v-for="report in filteredReports" :key="report.id">
                <ReportQueueItem :report="report" @refresh="emit('refresh')" />
            </template>
        </section>
        <section v-else class="box empty-state">
            <p>There are no reports.</p>
        </section>
    </section>
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