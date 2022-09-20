<script setup lang="ts">
import { User } from '../../api/types';

defineProps<{ user: User }>()

</script>

<template>
    <div class="box p-4 mb-2">
        <p class="title mb-4">Topics</p>
        <div class="followed-topics">
            <p class="tag is-light is-link" v-for="topic in user?.topics">{{ topic }}</p>
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