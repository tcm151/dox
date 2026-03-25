<script setup lang="ts">
import type { Feedback } from '~/types'

const cache = useCache()

const { data: feedback, refresh } = await useDatasource<Feedback[]>("/api/feedback")

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
    <article class="column g-2 p-4">
        <header class="row g-2">
            <button class="link f-1" @click="refresh()">
                <i class="fa-solid fa-rotate"></i>
                <span>Refresh</span>
            </button>
            <div class="box px-4 py-2">
                <Toggle v-model:enabled="showDismissed" label="Show Dismissed" />
            </div>
        </header>
        <section class="feedback column g-2" v-if="activeFeedback!.length > 0">
            <div class="box p-3" v-for="item in activeFeedback">
                <p>{{ item.content }}</p>
                <div class="tags row g-1 pt-1">
                    <UserTag :user="item.user" />
                    <DurationTag :time="item.time" />
                    <Tag v-if="!item.dismissed" type="danger" label="Dismiss" @click="dismissFeedback(item)" />
                </div>
            </div>
        </section>
        <section class="empty box p-3" v-else>
            <p>There is currently no feedback.</p>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}

section.feedback {
    p {
        font-weight: 600;
    }

    div.tags {
        width: min-content;
    }
}


section.empty {
    p {
        text-align: center;
    }
}
</style>