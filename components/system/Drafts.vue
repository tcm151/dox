<script setup lang="ts">
import { Draft } from '~/types';

const props = defineProps<{
    visible: boolean
}>()

const emit = defineEmits<{
    (event: 'close'): void
    (event: 'select', draft: Draft): void
}>()

const session = getSession()

let userDrafts = ref<Draft[]>([])

onMounted(async () => {
    userDrafts.value = await session.useApi<Draft[]>("/api/profile/drafts") ?? []
})

async function deleteDraft(draft: Draft) {
    userDrafts.value = userDrafts.value.filter(d => d.id !== draft.id)
    await session.useApi<Draft>(`/api/profile/drafts/${extractId(draft.id)}/delete`)
}
</script>

<template>
    <ClientOnly>
        <Window :visible="visible" title="Drafts" @close="emit('close')">
            <section class="drafts column" v-if="userDrafts.length > 0">
                <div class="column" v-for="draft in userDrafts" :key="draft.id">
                    <h3 class="title mx-1 mb-1">{{ draft.title }}</h3>
                    <div class="row g-2">
                        <span class="topic" v-for="topic in draft.topics">
                            {{ topic }}
                        </span>
                        <span class="info">{{ formatDate(draft.time) }}</span>
                        <button @click="emit('select', draft)">
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
            <Spinner fontSize="2rem" :showLoadingText="true" v-else /> 
        </Window>
    </ClientOnly>
</template>

<style scoped lang="scss">
section.drafts {
    @include flex-v (0.5rem);
    max-width: 750px;
    
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
</style>