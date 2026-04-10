<script setup lang="ts">
import type { Topic } from '@@/shared/types';

definePageMeta({
    middleware: () => {
        if (!ENV.isClient()) return

        const session = getSession()
        if (!session.isAuthenticated || !hasRole(session.user, ["moderator", "admin"])) {
            return abortNavigation()
        }
    }
})

const hints = useHints()
const route = useRoute()

const id = route.params.topic?.toString()
const topic = await useDatasource<Topic>(`/api/topic/${id}`)

const loading = ref<boolean>(false)
async function updateProfile() {
    try {
        loading.value = true
        await useApi(`/api/topic/${id}/update`, {
            body: topic.data.value
        })
        hints.addSuccess("Updated topic profile successfully.")
    }
    catch (error: any) {
        hints.addError("Failed to update topic profile.")
    }
    finally {
        loading.value = false
    }
}

// TODO add topic moderation controls for rename, archive/lock, and moderator assignment with role checks.
// TODO add topic usage moderation tools (remove topic from posts/threads in bulk, with confirmation and audit-safe UX).
// TODO add user score threshold for using topics to prevent spam and abuse, with appropriate feedback and appeals process for affected users.
</script>

<template>
    <article class="column g-2 m-4">
        <header class="row g-2">
            <button class="dark" @click="navigateTo(`/topic/${id}`)">
                <i class="fa solid fa-arrow-left"></i>
                View Topic
            </button>
        </header>
        <section v-if="topic.data.value" class="box column g-4 p-5">
            <div class="row between">
                <h1>{{ id }}</h1>
                <button @click="">
                    <i class="fa-solid fa-signature"></i>
                    Request Rename
                </button>
            </div>
            <div class="field">
                <label>Description</label>
                <textarea rows="4" v-model="topic.data.value.description" />
            </div>
            <div class="row g-2">
                <ButtonSpinner :loading="loading" class="success f-1" @click="updateProfile">
                    <i class="fa-solid fa-floppy-disk"></i>
                    Save
                </ButtonSpinner>
                <button class="dark" @click="topic.refresh()">
                    <i class="fa-solid fa-refresh"></i>
                    Reset
                </button>
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width (40rem, 1rem);
}
</style>