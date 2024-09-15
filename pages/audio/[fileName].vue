<script setup lang="ts">
import type { Audio, User } from "~/types"

definePageMeta({
    layout: 'middle'
})

const session = getSession()

const route = useRoute()
const fileName = route.params.fileName.toString()
const id = computed(() => fileName.split('.').at(0))

const { data: audio, refresh } = await useAsyncData(`audio:${id}`, () => {
    return $fetch<Audio>(`/api/audio/${id.value}`)
})

</script>

<template>
    <audio controls autoplay name="media">
        <source type="audio/mp3" :src="`${audio?.url}.mp3`" />
    </audio> 
</template>

<style scoped lang="scss">
article {
    max-width: 120rem;
}
</style>