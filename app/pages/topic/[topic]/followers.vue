<script setup lang="ts">
import type { Topic, User } from "@@/shared/types"

const route = useRoute()

const id = route.params.topic?.toString()
const { data: topic } = useNuxtData<Topic>(`topic:${id}`)
const { data: followers } = await useDatasource<User[]>(`/api/topic/${id}/followers`)
</script>

<template>
    <article class="p-4">
        <template v-if="topic">
            <TopicPreview :topic="topic" />
        </template>
        <section v-if="followers && followers.length > 0" class="box column g-2 p-3 mt-2">
            <template v-for="user in followers">
                <div class="row g-1">
                    <Votes :target="user" />
                    <UserTag class="f-1 b-0" :user="user" />
                    <DurationTag width="6rem" :time="user.dateJoined" />
                </div>
            </template>
        </section>
        <footer v-else class="box p-3 text center">
            <p>This doesn't have any followers.</p>
        </footer>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>