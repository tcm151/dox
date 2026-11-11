<script setup lang="ts">
import type { Report } from "@@/shared/types"
import type { ReportModerationView } from "@@/app/utils/moderation"

const props = defineProps<{
    report: Report & {
        moderation: ReportModerationView
        stage: { label: string, type: string }
    }
}>()

const emit = defineEmits<{
    (event: "refresh"): void
}>()

const hints = useHints()
const showReasons = ref<boolean>()
const moderationAction = ref<"resolve" | "remove" | "remove-topic" | "reopen">()
const actionMessage = ref("")
const topicRemovalScope = ref<string>()
const appealResolution = ref("")
const reasonsVisible = computed(() => showReasons.value ?? props.report.status === "pending")
const submittedAppeal = computed(() => [...props.report.history].reverse().find(entry => entry.action === "report.appeal.submitted"))
const isComment = computed(() => props.report.subject.id.startsWith("comment:"))

function commentContextId() {
    const context = props.report.subject.context
    return typeof context === "string" ? context : context?.id
}

function actionLabel(action: string) {
    const labels: Record<string, string> = {
        "report.approved": "Closed",
        "report.removed": "Removed",
        "report.reopened": "Reopened",
        "report.topic.removed": "Topic Removed",
        "report.topic_removed": "Topic Removed",
        "report.appeal.submitted": "Appealed",
        "report.appeal.accepted": "Accepted",
        "report.appeal.rejected": "Denied",
    }
    return labels[action] ?? action
}

const actionForm = computed(() => {
    if (moderationAction.value === "reopen") {
        return { placeholder: "Provide a reason for reopening this report...", submitLabel: "Reopen" }
    }
    if (moderationAction.value === "remove-topic") {
        return {
            placeholder: `Explain removing ${topicLabel(topicRemovalScope.value ?? "")} from this submission...`,
            submitLabel: "Remove Topic",
        }
    }
    if (moderationAction.value === "remove") {
        return { placeholder: "Provide a content removal reason...", submitLabel: "Remove Content" }
    }
    return { placeholder: "Provide an approval reason...", submitLabel: "Submit" }
})

function topicLabel(topic: string) {
    return extractId(topic) ?? topic
}

function viewSubject() {
    const subject = props.report.subject
    const contextId = isComment.value ? commentContextId() : undefined
    if (contextId) {
        navigateTo(`/${contextId.replace(":", "/")}#${encodeURIComponent(subject.id)}`)
        return
    }
    navigateTo(`/${subject.id.replace(":", "/")}`)
}

function startResolution() {
    if (!props.report.moderation.canApprove) return
    actionMessage.value = ""
    moderationAction.value = "resolve"
}

function startRemoval() {
    if (!props.report.moderation.canRemoveContent) return
    actionMessage.value = ""
    moderationAction.value = "remove"
}

function startTopicRemoval(topic: string) {
    if (!props.report.moderation.removableTopics.includes(topic)) return
    actionMessage.value = ""
    topicRemovalScope.value = topic
    moderationAction.value = "remove-topic"
}

function startReopen() {
    if (!props.report.moderation.canReopen) return
    actionMessage.value = ""
    moderationAction.value = "reopen"
}

function cancelModerationAction() {
    actionMessage.value = ""
    topicRemovalScope.value = undefined
    moderationAction.value = undefined
}

async function runReportAction(action: () => Promise<boolean>) {
    try {
        const completed = await action()
        if (completed) emit("refresh")
        return completed
    }
    catch (error: any) {
        hints.addError(error.message, error)
        return false
    }
}

async function submitModerationAction() {
    const action = moderationAction.value
    if (!action) return

    const completed = await runReportAction(() => action === "reopen"
        ? props.report.moderation.reopen(actionMessage.value)
        : props.report.moderation.submitResolution(action, actionMessage.value, topicRemovalScope.value))
    if (completed) cancelModerationAction()
}

function toggleReasons() {
    showReasons.value = !reasonsVisible.value
}
</script>

<template>
    <article class="report box hover-shadow column g-1 p-3">
        <header class="row g-1">
            <template v-for="topic in report.moderation.topics" :key="topic">
                <TopicTag class="b-0" :topic="topic" />
            </template>
        </header>
        <section class="row wrap g-1" :aria-busy="report.moderation.isUpdating">
            <Tag class="f-1" :type="report.stage.type" :label="report.stage.label" />
            <Tag class="f-1" type="danger" :label="report.subject.id" @click="viewSubject" />
            <Tag v-if="report.priority" type="warning" icon="fa-star" label="Priority" />
            <Tag class="f-1" type="danger" icon="fa-flag" :label="`${report.complaints.length} complaints`" />
            <Spinner v-if="report.moderation.isUpdating" :showText="false" role="status" />
            <Tag v-if="report.complaints.length > 0" class="danger" @click="toggleReasons">
                <i v-if="reasonsVisible" class="fa fa-angles-up"></i>
                <i v-else class="fa fa-angles-down"></i>
            </Tag>
        </section>
        <CollapseTransition>
            <section v-show="reasonsVisible" class="f-1 column g-1">
                <template v-for="(complaint, index) in report.complaints" :key="index">
                    <blockquote>
                        <strong>{{ complaint.user.name }}:</strong>
                        {{ complaint.reason }}
                    </blockquote>
                </template>
                <template v-for="entry in report.history" :key="`${entry.action}:${entry.time}`">
                    <span class="timestamp my-1">{{ actionLabel(entry.action) }} • {{ formatDate(entry.time) }} ago</span>
                    <blockquote>
                        <strong>{{ entry.user.name }}</strong>:
                        {{ entry.message }}
                    </blockquote>
                </template>
            </section>
        </CollapseTransition>
        <CollapseTransition mode="out-in" :speed="200">
            <section v-if="moderationAction && (report.moderation.canApprove || (moderationAction === 'reopen' && report.moderation.canReopen))" class="field g-2">
                <textarea v-model="actionMessage" :placeholder="actionForm.placeholder" rows="3" />
                <div class="row g-2">
                    <button type="button" class="small f-1" :disabled="report.moderation.isUpdating" @click="submitModerationAction">
                        <i class="fa fa-check"></i>
                        <span>{{ actionForm.submitLabel }}</span>
                    </button>
                    <button type="button" class="small f-1" :disabled="report.moderation.isUpdating" @click="cancelModerationAction">
                        <i class="fa fa-ban"></i>
                        <span>Cancel</span>
                    </button>
                </div>
            </section>
            <section v-else-if="report.status === 'appealed' && submittedAppeal" class="column g-1">
                <blockquote>
                    <strong>Appeal ({{ report.owner.name }}):</strong>
                    {{ submittedAppeal.message }}
                </blockquote>
                <template v-if="report.moderation.canReviewAppeal">
                    <label class="field">
                        <textarea v-model="appealResolution" placeholder="Provide an appeal decision reason..." rows="3" />
                    </label>
                    <div class="row g-2">
                        <button type="button" class="small f-1" @click="viewSubject">
                            <i class="fa fa-eye"></i>
                            <span>View</span>
                        </button>
                        <button type="button" class="small f-1" :disabled="report.moderation.isUpdating" @click="runReportAction(() => report.moderation.reviewAppeal('accept', appealResolution))">
                            <i class="fa-solid fa-check"></i>
                            <span>Accept</span>
                        </button>
                        <button type="button" class="small f-1" :disabled="report.moderation.isUpdating" @click="runReportAction(() => report.moderation.reviewAppeal('reject', appealResolution))">
                            <i class="fa-solid fa-xmark"></i>
                            <span>Reject</span>
                        </button>
                    </div>
                </template>
            </section>
            <section v-else-if="report.moderation.hasActions" class="row wrap g-1">
                <button v-if="report.moderation.canApprove" type="button" class="small f-1" :disabled="report.moderation.isUpdating" @click="startResolution">
                    <i class="fa fa-archive"></i>
                    <span>Close</span>
                </button>
                <button v-if="report.moderation.canRemoveContent" type="button" class="small f-1" :disabled="report.moderation.isUpdating" @click="startRemoval">
                    <i class="fa fa-trash"></i>
                    Remove
                </button>
                <template v-for="topic in report.moderation.removableTopics" :key="topic">
                    <button type="button" class="small" :disabled="report.moderation.isUpdating" :title="`Remove ${topicLabel(topic)} from this submission`" @click="startTopicRemoval(topic)">
                        <i class="fa fa-ban"></i>
                        <span>{{ topicLabel(topic) }}</span>
                    </button>
                </template>
                <button v-if="report.moderation.canReopen" type="button" class="small f-1" :disabled="report.moderation.isUpdating" @click="startReopen">
                    <i class="fa fa-undo"></i>
                    <span>Reopen</span>
                </button>
            </section>
        </CollapseTransition>
    </article>
</template>

<style scoped lang="scss">
span.timestamp {
    // font-style: italic;
    font-weight: var(--fw-bold);
    text-align: center;
}
</style>