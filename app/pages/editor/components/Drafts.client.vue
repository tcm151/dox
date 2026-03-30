<script setup lang="ts">
import type { Draft } from '@@/shared/types'

const emit = defineEmits<{
    (event: 'close'): void
    (event: 'view', draft: Draft): void
}>()

let { data: drafts, status, refresh } = await useDatasource<Draft[]>("/api/profile/drafts")
onMounted(() => refresh)

const loading = computed(() => {
    return status.value == 'pending'
})

async function deleteDraft(draft: Draft) {
    await useApi<Draft>(`/api/profile/drafts/${extractId(draft.id)}/delete`)
    await refresh()
}
</script>

<template>
    <Window title="Drafts" icon="fa-compass-drafting" width="40rem" @close="emit('close')">
        <section v-if="!loading && drafts && drafts.length > 0" class="drafts column g-3">
            <div v-for="draft in drafts" :key="draft.id">
                <h3 class="title text truncate mx-1 mb-1">{{ draft.title }}</h3>
                <div class="row wrap g-1">
                    <Tag type="link" class="f-1" v-for="topic in draft.topics" :label="extractId(topic)" />
                    <DurationTag :time="draft.time" />
                    <Tag class="info" icon="fa-pen" label="Edit" @click="emit('view', draft)" />
                    <Tag class="danger" icon="fa-trash-can" @click="deleteDraft(draft)">
                    </Tag>
                </div>
            </div>
        </section>
        <section class="grid center" v-else-if="!loading">
            <p>You have no drafts.</p>
        </section>
        <section class="grid center" v-else>
            <Spinner :showText="false" /> 
        </section>
    </Window>
</template>

<style scoped lang="scss">

section {
    min-height: 20rem;
}

section.drafts {
    h3 {
        padding-right: 2rem;
    }
}

section.empty-drafts {
    p {
        font-weight: 700;
    }
}
</style>