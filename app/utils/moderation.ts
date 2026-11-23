import type { Topic } from "#shared/types"

export const useModeration = () => {

    const hints = useHints()
    const session = getSession()
    const settings = useSettings()

    function canRequestTopic(topic: Topic) {
        return topic.moderators.length < settings.app.moderation.perTopic
            && session.user.topics.following.includes(topic.id)
            && hasTrait(session.user, "confirmed")
            && !session.moderates(topic.id)
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
        canRequest: canRequestTopic,
        request: requestModerator,
    }
}