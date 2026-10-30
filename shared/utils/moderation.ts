import type { Report, Topic } from "@@/shared/types"

type TopicScope = Pick<Topic, "id">
type ResolutionAction = "resolve" | "remove" | "remove-topic"

export const useModeration = () => {

    const hints = useHints()
    const session = getSession()
    const settings = useSettings()

    const updatingReportId = ref<string>()

    function moderatesTopic(topic: Topic) {
        return topic.moderators.some(m => m.id == session.user.id)
    }

    function canRequestTopic(topic: Topic) {
        return topic.moderators.length < settings.app.moderation.perTopic
            && session.user.topics.includes(topic.id)
            && hasTrait(session.user, "confirmed")
            && !moderatesTopic(topic)
    }

    async function requestModerator(topic: Topic) {
        try {
            await useApi(`/api/topic/${extractId(topic.id)}/request-moderation`)
            hints.addSuccess("Successfully requested to moderate this topic.")
        }
        catch (error: any) {
            hints.addError(error.statusText ?? "Failed to request to moderate this topic.")
        }
    }

    function topicLabel(topic: string) {
        return extractId(topic) ?? topic
    }

    function canActOnReport(report: Report) {
        return report.owner.id !== session.user.id
    }

    function isPending(report: Report) {
        return report.status === "pending"
    }

    function canApprove(report: Report) {
        return isPending(report) && canActOnReport(report)
    }

    function canRemovePendingContent(report: Report) {
        return isPending(report)
            && hasRole(session.user, "admin")
            && canActOnReport(report)
    }

    function canRemoveTopic(report: Report, topic: string, topics?: TopicScope[]) {
        if (report.subject.id.startsWith("comment:")) return false
        if (!hasRole(session.user, "moderator")) return false
        if (!canActOnReport(report) || !isPending(report)) return false
        return topics?.some(assignedTopic => assignedTopic.id === topic) ?? false
    }

    function removableTopics(report: Report, topics?: TopicScope[]) {
        return report.topics.filter(topic => canRemoveTopic(report, topic, topics))
    }

    function canReopenReport(report: Report) {
        return (report.status === "closed" || report.status === "removed" || report.status === "denied")
            && canActOnReport(report)
    }

    function canReviewAppeal(report: Report) {
        if (report.status !== "appealed") return false
        if (!canActOnReport(report)) return false
        return report.moderator?.id !== session.user.id
    }

    function reportEndpoint(report: Report, action: string, topics?: TopicScope[]) {
        const reportId = extractId(report.id)
        const assignedTopic = report.topics.find(reportTopic =>
            topics?.some(topic => topic.id === reportTopic))
        let assignedTopicId: string | undefined
        if (assignedTopic) assignedTopicId = extractId(assignedTopic)
        const hasTopicScope = (topics?.length ?? 0) > 0
        if (hasTopicScope && !assignedTopicId) throw new Error("Report is missing its topic scope.")
        let base = "/api/report"
        if (assignedTopicId) base = `/api/topic/${encodeURIComponent(assignedTopicId)}/reports`
        return `${base}/${reportId}/${action}`
    }

    async function updateReport(report: Report, success: string, request: () => Promise<unknown>) {
        if (updatingReportId.value) return false

        updatingReportId.value = report.id
        try {
            await request()
            hints.addSuccess(success)
            return true
        }
        finally {
            updatingReportId.value = undefined
        }
    }

    async function resolveReport(report: Report, note: string, topics?: TopicScope[]) {
        if (updatingReportId.value || !canActOnReport(report)) return false

        const endpoint = reportEndpoint(report, "resolve", topics)
        const body = { message: note }
        return updateReport(report, `Report for ${report.subject.id} approved.`, () =>
            useApi(endpoint, { method: "POST", body }))
    }

    async function removeReport(report: Report, note: string, topics?: TopicScope[]) {
        if (updatingReportId.value || !canRemovePendingContent(report)) return false

        const endpoint = reportEndpoint(report, "remove", topics)
        return updateReport(report, `Report for ${report.subject.id} removed.`, () =>
            useApi(endpoint, { method: "POST", body: { message: note } }))
    }

    async function removeTopicFromReport(report: Report, topic: string | undefined, note: string, topics?: TopicScope[]) {
        if (updatingReportId.value || !topic || !canRemoveTopic(report, topic, topics)) return false

        const topicId = extractId(topic)
        const reportId = extractId(report.id)
        if (!reportId || !topicId) throw new Error("Report or topic has an invalid record ID.")

        const endpoint = `/api/topic/${encodeURIComponent(topicId)}/reports/${reportId}/remove-topic`
        return updateReport(report, `Removed ${topicLabel(topic)} from ${report.subject.id}.`, () =>
            useApi(endpoint, { method: "POST", body: { message: note } }))
    }

    async function submitResolution(
        report: Report,
        action: ResolutionAction | undefined,
        rawNote: string,
        topic: string | undefined,
        topics?: TopicScope[],
    ) {
        if (!canActOnReport(report)) return false

        const note = rawNote.trim()
        const selectedAction = action ?? "resolve"
        if (!note) {
            hints.addWarning(selectedAction === "resolve"
                ? "Decision messages are required."
                : "Removal messages are required.")
            return false
        }

        if (selectedAction === "remove") return removeReport(report, note, topics)
        if (selectedAction === "remove-topic") return removeTopicFromReport(report, topic, note, topics)
        return resolveReport(report, note, topics)
    }

    async function reopenReport(report: Report, rawNote: string, topics?: TopicScope[]) {
        if (updatingReportId.value || !canActOnReport(report)) return false

        const note = rawNote.trim()
        if (!note) {
            hints.addWarning("A message is required to reopen a report.")
            return false
        }

        const endpoint = reportEndpoint(report, "reopen", topics)
        return updateReport(report, `Report for ${report.subject.id} reopened.`, () =>
            useApi(endpoint, { method: "POST", body: { message: note } }))
    }

    async function reviewAppeal(report: Report, decision: "accept" | "reject", rawNote: string, topics?: TopicScope[]) {
        if (updatingReportId.value || !canReviewAppeal(report)) return false

        const note = rawNote.trim()
        if (!note) {
            hints.addWarning("Appeal decision messages are required.")
            return false
        }

        const endpoint = reportEndpoint(report, `appeal/${decision}`, topics)
        return updateReport(report, `Appeal for ${report.subject.id} ${decision}ed.`, () =>
            useApi(endpoint, { method: "POST", body: { message: note } }))
    }

    function forReport(report: Report, topics?: TopicScope[]) {
        const reportTopics = report.topics
        const availableTopics = removableTopics(report, topics)
        const canApproveReport = canApprove(report)
        const canRemoveContent = canRemovePendingContent(report)
        const canReopen = canReopenReport(report)
        const canReview = canReviewAppeal(report)

        return {
            topics: reportTopics,
            isUpdating: updatingReportId.value === report.id,
            canApprove: canApproveReport,
            canRemoveContent,
            removableTopics: availableTopics,
            canReopen,
            canReviewAppeal: canReview,
            hasActions: canApproveReport || canRemoveContent || availableTopics.length > 0 || canReopen,
            submitResolution: (action: ResolutionAction | undefined, note: string, topic?: string) =>
                submitResolution(report, action, note, topic, topics),
            reopen: (note: string) => reopenReport(report, note, topics),
            reviewAppeal: (decision: "accept" | "reject", note: string) =>
                reviewAppeal(report, decision, note, topics),
        }
    }

    return {
        forTopic: moderatesTopic,
        canRequest: canRequestTopic,
        request: requestModerator,
        forReport,
    }
}

export type ReportModerationView = ReturnType<ReturnType<typeof useModeration>["forReport"]>