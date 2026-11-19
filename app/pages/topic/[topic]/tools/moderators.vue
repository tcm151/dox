<script setup lang="ts">
import type { Topic, User } from '@@/shared/types'

const hints = useHints()
const route = useRoute()
const session = getSession()

const isAdmin = hasRole(session.user, "admin")

const id = route.params.topic?.toString()

const { data: topic, error, pending, refresh } = await useDatasource<Topic>(`/api/topic/${id}/profile`)

watch(error, async (error) => {
    const status = error?.statusCode ?? error?.status
    if (status === 403) await navigateTo(`/topic/${id}`)
}, { immediate: true })

const savingModeratorId = ref<string>()
async function removeModerator(moderator: User & string) {
    if (!isAdmin || savingModeratorId.value) return

    try {
        savingModeratorId.value = moderator.id
        await useApi(`/api/topic/${id}/moderators/remove`, {
            body: { user: moderator.id },
        })
        hints.addSuccess("Removed moderator from topic.")
        await refresh()
    }
    catch (error: any) {
        hints.addError("Failed to remove moderator from topic.", error)
    }
    finally {
        savingModeratorId.value = undefined
    }
}
</script>

<template>
    <article class="content-width column g-2 m-4">
        <header class="row wrap inline between g-2">
            <h1>Moderators</h1>
            <ButtonSpinner class="dark" :loading="pending" @click="refresh()">
                <i class="fa-solid fa-rotate"></i>
                <span>Refresh</span>
            </ButtonSpinner>
        </header>
        <section v-if="topic" class="box column g-2 p-3">
            <div v-if="topic.moderators.length > 0" class="column g-1">
                <div v-for="moderator in topic.moderators" :key="moderator.id" class="moderator-row row wrap inline g-1">
                    <UserTag class="f-1 b-0" :user="moderator" />
                    <ButtonSpinner
                        v-if="isAdmin"
                        class="danger small"
                        :loading="savingModeratorId === moderator.id"
                        :disabled="!!savingModeratorId"
                        @click="removeModerator(moderator)"
                    >
                        Remove
                    </ButtonSpinner>
                </div>
            </div>
            <p v-else class="tip">No moderators are assigned to this topic.</p>
        </section>
    </article>
</template>
