<script setup lang="ts">
import type { Feedback } from '@@/shared/types'

const cache = useCache()

const { data: feedback, pending, refresh } = await useAuthenticatedDatasource<Feedback[]>("/api/feedback")

const activeFeedback = computed(() => {
    return feedback.value?.filter(f => (showDismissed.value) ? f : !f.dismissed) ?? []
})

const showDismissed = cache.get('admin.feedback.showDismissed', () => false)
async function dismissFeedback(feedback: Feedback) {
    await useApi<Feedback>(`/api/feedback/${extractId(feedback.id)}/dismiss`)
    await refresh()
}
</script>

<template>
    <article class="content-width column g-2 p-4">
        <header class="row wrap inline between g-2">
            <h1>Feedback</h1>
            <div class="row g-1">
                <div class="box px-4 py-2">
                    <Toggle v-model:enabled="showDismissed" label="Show Dismissed" />
                </div>
                <ButtonSpinner class="dark" :loading="pending" @click="refresh()">
                    <i class="fa-solid fa-rotate"></i>
                    <span>Refresh</span>
                </ButtonSpinner>
            </div>
        </header>
        <section v-if="activeFeedback.length > 0" class="feedback column g-2">
            <template v-for="item in activeFeedback" :key="item.id">
                <article class="box p-3">
                    <blockquote>
                        {{ item.content }}
                    </blockquote>
                    <div class="tags row g-1 pt-2">
                        <DurationTag :time="item.time" />
                        <UserTag class="f-1" :user="item.user" />
                        <Tag v-if="!item.dismissed" type="danger" icon="fa-angles-right" label="Dismiss" @click="dismissFeedback(item)" />
                    </div>
                </article>
            </template>
        </section>
        <section v-else-if="feedback" class="box empty-state" aria-live="polite">
            <p v-if="showDismissed || feedback.length === 0">There is currently no feedback.</p>
            <p v-else>No active feedback matches the current filter.</p>
        </section>
    </article>
</template>