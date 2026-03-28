<script setup lang="ts">
import type { Topic } from '~/types';

definePageMeta({
    middleware: (to, from) => {
        const session = getSession()
        const isModerator = hasRole(session.user, "moderator")
        if (!session.isAuthenticated || (!isModerator && !hasRole(session.user, "admin"))) {
            return abortNavigation()
        }
    }
})

const route = useRoute()

const id = route.params.topic?.toString()
const topic = await useDatasource<Topic>(`/api/topic/${id}`)
</script>

<template>
    <article class="m-4">
        <section v-if="topic.data.value" class="box column g-4 p-5">
            <h1>{{ id }}</h1>
            <div class="field">
                <label>Description</label>
                <textarea rows="4" />
            </div>
            <div class="row g-2">
                <button class="success f-1">
                    <i class="fa-solid fa-floppy-disk"></i>
                    Save
                </button>
                <button class="dark">
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