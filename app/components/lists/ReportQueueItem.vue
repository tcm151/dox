<script setup lang="ts">
import type { Report } from "@@/shared/types"

const props = defineProps<{
    report: Report
}>()

const emit = defineEmits<{
    (event: "refresh"): void
}>()

const hints = useHints()
const session = getSession()

const message = ref("")
const removedTopic = ref<string>()
const action = ref<"resolve" | "remove" | "topic.remove" | "reopen" | "reviewing" | "appeal.accept" | "appeal.reject">()

function actionLabel(action: string) {
    const labels: Record<string, string> = {
        "report.approved": "Closed",
        "report.removed": "Removed",
        "report.reopened": "Reopened",
        "report.topic.removed": "Topic Removed",
        "report.appeal.submitted": "Appealed",
        "report.appeal.accepted": "Accepted",
        "report.appeal.rejected": "Denied",
    }
    return labels[action] ?? action
}

function viewSubject() {
    const subject = props.report.subject
    const context = props.report.subject.context
    if (context) {
        navigateTo(`/${context.replace(":", "/")}#${subject.id}`)
    }
    else {
        navigateTo(`/${subject.id.replace(":", "/")}`)
    }
}

const canModerate = computed(() => {
    return props.report.owner.id !== session.user.id
        && (session.moderatesAny(props.report.topics) || hasRole(session.user, "admin"))
})

const canClose = computed(() => {
    return canModerate.value
        && props.report.status === "pending"
})

// return `/api/topic/${topicId}/reports/${reportId}/${action}`
// return `/api/report/${reportId}/${action}`

const submitting = ref<boolean>(false)
async function handleAction() {
    try {
        submitting.value = true
        const reportId = extractId(props.report.id)
        await useApi(`/api/report/${reportId}/${action.value!.replace(".", "/")}`, {
            body: {
                message: message.value
            }
        })
        hints.addSuccess(`Report ${action.value} successfully.`)
        emit("refresh")
    }
    catch (error: any) {
        console.log(error)
        hints.addError(`Failed to ${action.value} report.`, error)
    }
    finally {
        submitting.value = false
    }
}

async function closeReport() {
    action.value = "resolve"
}

const canRemove = computed(() => {
    return props.report.owner.id !== session.user.id
        && hasRole(session.user, "admin")
        && props.report.status === "pending"
})

function removeReport() {
    action.value = "remove"
}

function canRemoveTopic(topic: string) {
    return canModerate.value
        && session.moderates(topic)
        && !props.report.subject.id.startsWith("topic:")
        && !props.report.subject.id.startsWith("comment:")
        && props.report.status === "pending"
}

function removeTopic(topic: string) {
    removedTopic.value = topic
    action.value = "topic.remove"
}

const canReopen = computed(() => {
    return canModerate.value
        && ["closed", "removed", "denied"].includes(props.report.status)
})

function reopenReport() {
    action.value = "reopen"
}

const canReview = computed(() => {
    return canModerate.value
        && props.report.status === "appealed"
        && props.report.moderator?.id !== session.user.id
})

function reviewAppeal() {
    action.value = "reviewing"
}

async function acceptAppeal() {
    action.value = "appeal.accept"
    await handleAction()
}

async function rejectAppeal() {
    action.value = "appeal.reject"
    await handleAction()
}

function cancelAction() {
    message.value = ""
    action.value = undefined
    removedTopic.value = undefined
}

const showComplaints = ref(true)
function toggleComplaints() {
    showComplaints.value = !showComplaints.value
}

const showHistory = ref<boolean>(true)
function toggleHistory() {
    showHistory.value = !showHistory.value
}
</script>

<template>
    <article class="report box hover-shadow column g-1 p-3">
        <header v-if="report.topics.length" class="row g-1">
            <template v-for="topic in report.topics" :key="topic">
                <TopicTag class="f-1 b-0" :topic="topic" />
            </template>
            <Tag v-if="report.complaints.length > 0" class="link b-0" @click="toggleComplaints">
                <i v-if="showComplaints" class="fa fa-angles-up"></i>
                <i v-else class="fa fa-angles-down"></i>
            </Tag>
        </header>
        <CollapseTransition>
            <template v-if="showComplaints">
                <blockquote v-for="(complaint, index) in report.complaints" :key="index">
                    <strong>{{ complaint.user.name }}:</strong>
                    {{ complaint.reason }}
                </blockquote>
            </template>
        </CollapseTransition>
        <section class="row wrap g-1">
            <Tag class="f-1 b-0 capitalize" type="danger" :label="report.status" />
            <Tag class="f-2 b-0" type="danger" :label="report.subject.id" @click="viewSubject" />
            <Tag v-if="report.priority" class="warning f-1 b-0" icon="fa-star" label="Priority" />
            <Tag class="f-1 b-0" type="danger" icon="fa-flag" :label="`${report.complaints.length} complaints`" />
            <Tag v-if="report.history.length > 0" class="danger b-0" @click="toggleHistory">
                <i v-if="showHistory" class="fa fa-angles-up"></i>
                <i v-else class="fa fa-angles-down"></i>
            </Tag>
        </section>
        <CollapseTransition>
            <section v-if="report.history.length && showHistory" class="f-1 column g-1">
                <template v-for="entry in report.history" :key="`${entry.action}:${entry.time}`">
                    <!-- <p class="timestamp">
                        {{ actionLabel(entry.action) }} • {{ formatDate(entry.time) }} ago
                    </p> -->
                    <blockquote>
                        <strong>{{ entry.user.name }}:</strong>
                        {{ entry.message }}
                    </blockquote>
                </template>
            </section>
        </CollapseTransition>
        <CollapseTransition mode="out-in" :speed="200">
            <template v-if="canModerate">
                <section v-if="action && action !== 'reviewing'" class="field g-2">
                    <textarea v-model="message" rows="3" />
                    <div class="row g-2">
                        <button type="button" class="small f-1" @click="handleAction">
                            <i class="fa fa-check"></i>
                            <span>Submit</span>
                        </button>
                        <button type="button" class="small f-1" @click="cancelAction">
                            <i class="fa fa-ban"></i>
                            <span>Cancel</span>
                        </button>
                    </div>
                </section>
                <section v-else-if="action === 'reviewing'" class="column g-1">
                    <label class="field">
                        <textarea v-model="message" rows="3" />
                    </label>
                    <div class="row g-1">
                        <button type="button" class="small f-1" @click="acceptAppeal">
                            <i class="fa-solid fa-check"></i>
                            <span>Accept</span>
                        </button>
                        <button type="button" class="small f-1" @click="rejectAppeal">
                            <i class="fa-solid fa-xmark"></i>
                            <span>Reject</span>
                        </button>
                        <button type="button" class="small f-1" @click="cancelAction">
                            <i class="fa fa-ban"></i>
                            <span>Cancel</span>
                        </button>
                    </div>
                </section>
                <section class="row wrap g-1">
                    <button v-if="canReview" type="button" class="small f-1" @click="reviewAppeal">
                        <i class="fa fa-archive"></i>
                        <span>Review</span>
                    </button>
                    <button v-if="canClose" type="button" class="small f-1" @click="closeReport">
                        <i class="fa fa-archive"></i>
                        <span>Close</span>
                    </button>
                    <button v-if="canRemove" type="button" class="small f-1" @click="removeReport">
                        <i class="fa fa-trash"></i>
                        <span>Remove</span>
                    </button>
                    <template v-for="topic in report.topics" :key="topic">
                        <button v-if="canRemoveTopic(topic)" type="button" class="small"  @click="removeTopic(topic)">
                            <i class="fa fa-ban"></i>
                            <span>{{ extractId(topic) }}</span>
                        </button>
                    </template>
                    <button v-if="canReopen" type="button" class="small f-1"  @click="reopenReport">
                        <i class="fa fa-undo"></i>
                        <span>Reopen</span>
                    </button>
                </section>
            </template>
        </CollapseTransition>
    </article>
</template>

<style scoped lang="scss">
.timestamp {
    font-size: 0.8em;
    text-align: center;
    font-weight: var(--fw-normal);
}
</style>