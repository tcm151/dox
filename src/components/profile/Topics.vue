<script setup lang="ts">
import { User } from '../../api/types';
import Tag from '../utilities/Tag.vue';

defineProps<{ user: User }>()

function toRoute(topic: string) {
    return `/topic/${topic}`;
}

</script>

<template>
    <div class="box p-4 mb-2">
        <p class="title mb-4">Topics</p>
        <div class="followed-topics">
            <Tag v-for="topic in user?.topics"
                :label="topic"
                class="is-light is-link"
                :route="`/topic/${topic}`" />
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '../../styles/global.scss';

.followed-topics {
    @include flex-hw;
    gap: 0.25em;

    p {
        font-weight: 500;
    }
}
</style>