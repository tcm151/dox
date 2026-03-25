<script setup lang="ts">
import type { Image } from '~/types'

const props = defineProps<{
    image: Image
}>()

</script>

<template>
    <main class="thread">
        <div class="main box column p-3" @click="navigateTo(`/image/${extractId(image.id)}`)">
            <header class="row-wrap g-1 mb-2">
                <Votes :target="image" />
                <UserTag class="f-1" :user="image.user" />
                <DurationTag :time="image.time" />
                <!-- <Tag type="info" icon="fa-image" :label="image.type" /> -->
                <!-- <Tag type="warning" icon="fa-cube" :label="`${image.tokens} tokens`" /> -->
                <!-- <TopicTag class="f-10" v-for="topic in image.topics" :topic="topic" /> -->
                <!-- <Tag type="danger" icon="fa-flag" label="Report" @click="reportImage" /> -->
                <!-- <Tag
                    v-if="session.user.id == image.user.id || hasRole(session.user, 'admin')"
                    type="danger"
                    icon="fa-trash-can"
                    label="Delete"
                    @click="deleteImage"
                /> -->
            </header>
            <div class="image">
                <img :src="image.url">
            </div>
        </div>
    </main>
</template>

<style scoped lang="scss">
div.image {
    img {
        max-height: 80vh;
        object-fit: cover;
    }
}
</style>