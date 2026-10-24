<script setup lang="ts">
import type { Image } from '@@/shared/types'

const props = defineProps<{
    image: Image
}>()

</script>

<template>
    <main class="thread">
        <div class="main box column p-3" @click="navigateTo(`/image/${extractId(image.id)}`)">
            <header class="row wrap g-1 mb-2">
                <Votes :target="image" />
                <div class="row wrap f-1 g-1">
                    <UserTag class="f-1" :user="image.user" />
                    <Tag class="f-1" type="info" icon="fa-chart-simple" :label="image.visits" />
                    <DurationTag class="f-1" :time="image.time" />
                </div>
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
        width: stretch;
        max-height: 80vh;
        border-radius: 0.25rem;
        object-fit: cover;
    }
}
</style>