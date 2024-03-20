<script setup lang="ts">
import type { Feedback, User } from '~/types'

const cache = useCache()
const session = getSession()

const { data: tickets, refresh } = useAsyncData("developer.tickets", () => {
    return $fetch<Feedback[]>("/api/developer/tickets")
})

</script>

<template>
    <article class="column g-2 p-4">
        <div class="tickets box column g-1 p-4" v-for="item in tickets">
            <p>{{ item.content }}</p>
            <div class="tags row g-1 pt-1">
                <Tag type="link" icon="fa-circle-check" label="Complete" @click="" />
                <TimeTag :time="item.time" />
                <UserTag :user="(item.user as User)" />
            </div>
        </div>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}

div.tickets {
    p {
        font-weight: 600;
    }
}
</style>