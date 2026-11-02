import { computed, onScopeDispose, ref, toValue, type MaybeRefOrGetter } from "vue"
import type { ContentModerationState } from "@@/shared/types"

interface ModeratedTarget {
    id: string
    moderation?: ContentModerationState
}

interface SubmissionStateOptions {
    additionalLocks?: MaybeRefOrGetter<ModeratedTarget[]>
    quote?: MaybeRefOrGetter<boolean>
}

export const useSlowMode = defineStore("slowMode", () => {
    const submissions = ref<Record<string, number>>({})
    const now = ref(Date.now())
    const session = getSession()
    const clock = import.meta.client
        ? setInterval(() => now.value = Date.now(), 1000)
        : undefined

    if (clock) onScopeDispose(() => clearInterval(clock))

    function secondsRemaining(targetId: string, slowMode?: number): number {
        if (!slowMode) return 0

        const submittedAt = submissions.value[`${session.user.id}:${targetId}`]
        if (!submittedAt) return 0

        return Math.max(0, Math.ceil((submittedAt + slowMode * 1000 - now.value) / 1000))
    }

    function recordSubmission(targetId: string) {
        submissions.value[`${session.user.id}:${targetId}`] = Date.now()
        now.value = Date.now()
    }

    function resolveSubmissionState(
        target: ModeratedTarget | undefined,
        additionalLocks: ModeratedTarget[] = [],
        quote = false,
    ) {
        const targetType = target?.id.split(":", 1)[0]
        const actionLabel = targetType === "thread" || targetType === "comment" ? "reply" : "comment"
        const remainingSeconds = target && !quote
            ? secondsRemaining(target.id, target.moderation?.slowed)
            : 0
        const lockedTarget = [target, ...additionalLocks].find(item => item?.moderation?.locked)
        const warning = remainingSeconds > 0
            ? `Slow mode is active. You can ${actionLabel} again in ${formatCooldown(remainingSeconds)}.`
            : undefined

        return {
            remainingSeconds,
            disabled: Boolean(lockedTarget) || remainingSeconds > 0,
            warning,
        }
    }

    function submissionState(
        target: MaybeRefOrGetter<ModeratedTarget | undefined>,
        options: SubmissionStateOptions = {},
    ) {
        return computed(() => resolveSubmissionState(
            toValue(target),
            toValue(options.additionalLocks ?? []),
            toValue(options.quote ?? false),
        ))
    }

    function submissionStates(
        targets: MaybeRefOrGetter<ModeratedTarget[]>,
    ) {
        return computed(() => Object.fromEntries(
            toValue(targets).map(target => [target.id, resolveSubmissionState(target)]),
        ))
    }

    return { recordSubmission, submissionState, submissionStates }
})

function formatCooldown(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes === 0) return `${seconds}s`
    return remainingSeconds === 0 ? `${minutes}m` : `${minutes}m ${remainingSeconds}s`
}