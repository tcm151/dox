import type { User, Topic } from "@@/shared/types"

export const useModeration = () => {

    const hints = useHints()
    const session = getSession()
    const settings = useSettings()

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

    return {
        forTopic: moderatesTopic,
        canRequest: canRequestTopic,
        request: requestModerator,
    }
}