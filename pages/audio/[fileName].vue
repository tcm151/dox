<script setup lang="ts">
import type { Audio } from "~/types"

definePageMeta({
    layout: 'middle'
})

const route = useRoute()
const fileName = route.params.fileName?.toString()
const id = computed(() => fileName?.split('.').at(0))

const { data: audio } = await useFetch<Audio>(`/api/audio/${id.value}`)
</script>

<template v-if="id && audio">
    <audio controls autoplay name="media">
        <source type="audio/mp3" :src="`${audio?.url}.mp3`" />
    </audio> 
</template>

<style scoped lang="scss">
article {
    max-width: 120rem;
}
</style>