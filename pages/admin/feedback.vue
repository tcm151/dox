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

</script>

<template>
    <article class="column g-2 p-4">
        <header class="row g-2">
            <DevOnly>
                <button class="link" @click="refresh()">
                    <i class="fa-solid fa-rotate"></i>
                    <span>Refresh</span>
                </button>
                <div class="box px-4 py-2">
                    <Toggle v-model:enabled="showDismissed" label="Show Dismissed" />
                </div>
            </DevOnly>
        </header>
        <div class="feedback column g-1 p-4" v-for="item in activeFeedback">
            <p>{{ item.content }}</p>
            <div class="tags row g-1 pt-1">
                <TimeTag :time="item.time" />
                <UserTag :user="(item.user as User)" />
                <Tag v-if="!item.dismissed" type="danger" label="Dismiss" @click="dismissFeedback(item)" />
            </div>
        </div>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}

div.feedback {
    border-radius: 0.25rem;
    background-color: $white-0;

    p {
        font-weight: 600;
    }
}

div.tags {
    width: min-content;
}
</style>