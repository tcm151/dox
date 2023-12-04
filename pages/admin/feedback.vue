<script setup lang="ts">
import type { Feedback, User } from '~/types'

const cache = useCache()
const session = getSession()

const { data: feedback, refresh } = useAsyncData("feedback", () => {
    return $fetch<Feedback[]>("/api/feedback")
})

const showDismissed = cache.get('admin.feedback.showDismissed', () => false)

const activeFeedback = computed(() => {
    return feedback.value?.filter(f => (showDismissed.value) ? f : !f.dismissed)
})

async function dismissFeedback(feedback: Feedback) {
    await session.useApi<Feedback>(`/api/feedback/${extractId(feedback.id)}/dismiss`)
    await refresh()
}

async function promoteFeedback(feedback: Feedback) {
    await session.useApi<Feedback>(`/api/feedback/${extractId(feedback.id)}/promote`)
    await refresh()
}

</script>

<template>
    <article class="column g-2 p-4">
        <header class="box row g-4 p-4">
            <DevOnly>
                <button class="link" @click="">
                    <i class="fa-solid fa-download"></i>
                    <span>Import Feedback</span>
                </button>
            </DevOnly>
            <Toggle v-model:enabled="showDismissed" label="Show Dismissed" />
        </header>
        <div class="feedback column g-1 p-4" v-for="item in activeFeedback">
            <p>{{ item.content }}</p>
            <div class="tags row g-1 pt-1">
                <Tag type="link" icon="fa-arrow-trend-up" label="Promote" @click="promoteFeedback(item)" />
                <TimeTag :time="item.time" />
                <UserTag :user="(item.user as User)" />
                <Tag v-if="!item.dismissed" type="danger" label="Dismiss" @click="dismissFeedback(item)" />
            </div>
        </div>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(800px, 1rem);
}

div.feedback {
    border-radius: 0.25rem;
    background-color: $dox-white-0;

    p {
        font-weight: 600;
    }
}

div.tags {
    width: min-content;
}
</style>