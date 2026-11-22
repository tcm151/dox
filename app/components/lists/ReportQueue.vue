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

const reportStatuses = [
    { status: "pending", label: "Pending", type: "danger" },
    { status: "appealed", label: "Appealed", type: "info" },
    { status: "denied", label: "Denied", type: "danger" },
    { status: "closed", label: "Closed", type: "success" },
    { status: "removed", label: "Removed", type: "warning" },
]

const selectedTopic = ref("")
const selectedStatus = ref<string>("pending")

const filteredReports = computed(() => {
    return props.reports.filter(report => report.status === selectedStatus.value)
})

function statusCount(status: string) {
    return props.reports.filter(r => r.status === status).length
}

function setStatus(status: string) {
    selectedStatus.value = status
}

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
                <button v-if="statusCount(stage.status)" type="button" class="f-1" :class="{ selected: selectedStatus === stage.status }" @click="setStatus(stage.status)">
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
            <p>There are no reports in this stage.</p>
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