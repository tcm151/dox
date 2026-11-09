<script setup lang="ts">
import type { Topic } from '@@/shared/types';

definePageMeta({
    middleware: () => {
        if (!ENV.isClient()) return

        const session = getSession()
        if (!session.isAuthenticated || !hasRole(session.user, "moderator")) {
            return abortNavigation()
        }
    }
})

const hints = useHints()
const route = useRoute()

const id = route.params.topic?.toString()
const topic = await useDatasource<Topic>(`/api/topic/${id}`)
const postIntervalMinutes = computed({
    get: () => (topic.data.value?.moderation.maxPostInterval ?? 0) / 60,
    set: (minutes: number) => {
        const profile = topic.data.value
        if (!profile) return

        profile.moderation.maxPostInterval = Math.round(minutes * 60)
    },
})

const loading = ref<boolean>(false)
async function updateProfile() {
    const profile = topic.data.value
    if (!profile) return

    try {
        loading.value = true
        await useApi(`/api/topic/${id}/update`, {
            body: {
                description: profile.description ?? "",
                moderation: profile.moderation,
            }
        })
        hints.addSuccess("Updated topic profile successfully.")
    }
    catch (error: any) {
        hints.addError("Failed to update topic profile.", error)
    }
    finally {
        loading.value = false
    }
}

</script>

<template>
    <article class="content-width column g-2 m-4">
        <header class="row g-2">
            <button class="dark" @click="navigateTo(`/topic/${id}`)">
                <i class="fa-solid fa-arrow-left"></i>
                View Topic
            </button>
        </header>
        <section v-if="topic.data.value" class="box column g-4 p-5">
            <div class="row between">
                <h2>{{ id }}</h2>
                <button @click="">
                    <i class="fa-solid fa-signature"></i>
                    Request Rename
                </button>
            </div>
            <div class="field">
                <label>Description</label>
                <textarea rows="4" v-model="topic.data.value.description" />
            </div>
            <div class="field row">
                <div class="column f-1">
                    <label>Topic Usage Interval (minutes)</label>
                    <span class="tip">A user can use this topic once per interval. Default: 1 minute, 0 disables.</span>
                </div>
                <input class="py-1 px-2" type="number" min="0" max="60" step="0.5" v-model.number="postIntervalMinutes">
            </div>
            <div class="field row">
                <div class="column f-1">
                    <label>Priority Report Threshold</label>
                    <span class="tip">Reports will be given priority for review after this many reports. Default: 5.</span>
                </div>
                <input class="py-1 px-2" type="number" min="1" max="100" step="1" v-model.number="topic.data.value.moderation.priorityReportThreshold">
            </div>
            <div class="row g-2">
                <ButtonSpinner :loading="loading" class="success f-2" @click="updateProfile">
                    <i class="fa-solid fa-floppy-disk"></i>
                    Save
                </ButtonSpinner>
                <button class="f-1" @click="topic.refresh()">
                    <i class="fa-solid fa-refresh"></i>
                    Cancel
                </button>
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
.field input[type=number] {
    width: 6rem;
    text-align: center;
    appearance: auto;

    &::-webkit-inner-spin-button {
        opacity: 1;
    }
}
</style>
