<script setup lang="ts">
import type { User } from '~/types'

const { data: feedback } = useAsyncData("feedback", () => {
    return $fetch("/api/feedback")
})
</script>

<template>
    <article class="column g-2 p-4">
        <div class="feedback column g-1 p-4" v-for="item in feedback">
            <p>{{ item.content }}</p>
            <div class="row g-1">
                <span class="tag info">{{ (item.user as User).name }}</span>
                <span class="tag info">{{ formatDate(item.time) }}</span>
            </div>
        </div>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(500px, 1rem);
}

div.feedback {
    border-radius: 0.25rem;
    background-color: $dox-white-0;

    p {
        font-weight: 600;
    }
}

div.row {
    span {
        cursor: pointer;
    }
}
</style>