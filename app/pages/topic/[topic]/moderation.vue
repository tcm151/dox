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
        hints.addError("Failed to update topic profie.")
    }
    finally {
        loading.value = false
    }
}

const tab = ref<string>("first")
function switchTabs(newTab: string) {
    tab.value = newTab
}

// TODO implement additional ways to customize a topic
// TODO allow moderating usages of the topic, removing from submissions, etc
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
            <h1>{{ id }}</h1>
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