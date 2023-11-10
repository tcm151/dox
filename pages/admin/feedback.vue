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
            <div class="tags row g-1 pt-1">
                <TimeTag :time="item.time" />
                <UserTag :user="(item.user as User)" />
            </div>
        </div>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(800px, 1rem);
}

div.feedback {
    border-radius: 0.25rem;
    background-color: $dox-white-0;

    p {
        font-weight: 600;
    }
}

div.tags {
    width: min-content;
}
</style>