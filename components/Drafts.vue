<script setup lang="ts">
import { Draft } from '~/types';

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
    <ClientOnly>
        <Window
            title="Drafts"
            :width="800"
            :visible="visible"
            @close="emit('close')"
        >
            <section class="drafts column" v-if="!loading && userDrafts.length > 0">
                <div class="column" v-for="draft in userDrafts" :key="draft.id">
                    <h3 class="title mx-1 mb-1">{{ draft.title }}</h3>
                    <div class="row g-2">
                        <span class="topic" v-for="topic in draft.topics">
                            {{ topic.split(':')[1] }}
                        </span>
                        <span class="info">{{ formatDate(draft.time) }}</span>
                        <button @click="emit('view', draft)">
                            <i class="fa-solid fa-book-open"></i>
                            <span>View</span>
                        </button>
                        <button class="danger" @click="deleteDraft(draft)">
                            <i class="fa-solid fa-trash"></i>
                            <span>Delete</span>
                        </button>
                    </div>
                </div>
            </section>
            <section class="empty-drafts" v-else-if="!loading">
                <p>You have no drafts...</p>
            </section>
            <section class="loading" v-else>
                <Spinner fontSize="2rem" :showLoadingText="false" /> 
            </section>
        </Window>
    </ClientOnly>
</template>

<style scoped lang="scss">

section {
    min-height: 512px;
}

section.drafts {
    @include flex-v (0.5rem);
    
    h3 {
        overflow-x: hidden;
        text-overflow: ellipsis;
    }

    #post-title {
        font-size: 1.25rem;
        font-weight: 500;
        white-space: nowrap;
    }    

    .topic, .info, button {
        font-size: 1rem;
        font-weight: 700;
        text-align: center;
        white-space: nowrap;
        border-radius: 0.25rem;
        padding: 0.25rem 1rem;
    }

    .topic, .info {
        flex: 1 1 auto;
    }

    button {
        flex: 0 1 32px;
    }

    button {
        @include flex-h (0.5rem);
        justify-content: center;
        align-items: center;
    }
}

section.empty-drafts, section.loading {
    @include flex-v;
    justify-content: center;
    text-align: center;
}

section.empty-drafts {
    p {
        font-weight: 700;
    }
}
</style>