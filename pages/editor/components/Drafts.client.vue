<script setup lang="ts">
import type { Draft } from '~/types'

const props = defineProps<{
    visible: boolean
}>()

const emit = defineEmits<{
    (event: 'close'): void
    (event: 'view', draft: Draft): void
}>()

const session = getSession()

let loading = ref(false)
let userDrafts = ref<Draft[]>([])

watch(props, async (value) => {
    if (value.visible) {
        loading.value = true
        userDrafts.value = await session.useApi<Draft[]>("/api/profile/drafts") ?? []
        loading.value = false
    }
})

async function deleteDraft(draft: Draft) {
    userDrafts.value = userDrafts.value.filter(d => d.id !== draft.id)
    await session.useApi<Draft>(`/api/profile/drafts/${extractId(draft.id)}/delete`)
}
</script>

<template>
    <Window
        :visible="visible"
        width="40rem"
        title="Drafts"
        icon="fa-solid fa-compass-drafting"
        @close="emit('close')"
    >
        <section class="drafts column g-3" v-if="!loading && userDrafts.length > 0">
            <div v-for="draft in userDrafts" :key="draft.id">
                <h3 class="title mx-1 mb-1">{{ draft.title }}</h3>
                <div class="row-wrap g-1">
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
        overflow-x: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
}

section.empty-drafts {
    p {
        font-weight: 700;
    }
}
</style>