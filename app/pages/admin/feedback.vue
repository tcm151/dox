<script setup lang="ts">
import type { Feedback } from '@@/shared/types'

const cache = useCache()

const { data: feedback, refresh } = await useAuthenticatedDatasource<Feedback[]>("/api/feedback")

const activeFeedback = computed(() => {
    return feedback.value?.filter(f => (showDismissed.value) ? f : !f.dismissed)
})

const showDismissed = cache.get('admin.feedback.showDismissed', () => false)
async function dismissFeedback(feedback: Feedback) {
    await useApi<Feedback>(`/api/feedback/${extractId(feedback.id)}/dismiss`)
    await refresh()
}
</script>

<template>
    <article class="content-width column g-2 p-4">
        <header class="row g-2">
            <button class="link f-1" @click="refresh()">
                <i class="fa-solid fa-rotate"></i>
                <span>Refresh</span>
            </button>
            <div class="box px-4 py-2">
                <Toggle v-model:enabled="showDismissed" label="Show Dismissed" />
            </div>
        </header>
        <section v-if="activeFeedback!.length > 0" class="feedback column g-2">
            <div class="box p-3" v-for="item in activeFeedback">
                <p>{{ item.content }}</p>
                <div class="tags row g-1 pt-1">
                    <DurationTag :time="item.time" />
                    <UserTag class="f-1" :user="item.user" />
                    <Tag v-if="!item.dismissed" type="danger" icon="fa-angles-right" label="Dismiss" @click="dismissFeedback(item)" />
                </div>
            </div>
        </section>
        <section v-else class="box empty-state">
            <p>There is currently no feedback.</p>
        </section>
    </article>
</template>