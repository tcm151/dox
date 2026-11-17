<script setup lang="ts">
import type { Topic, User } from "@@/shared/types"

const route = useRoute()

const id = route.params.id?.toString()
const { data: user } = useNuxtData<User>(`user:${id}`)
const { data: topics } = await useDatasource<Topic[]>(`/api/user/${id}/topics`)
</script>

<template>
    <article class="content-width column g-2 p-4">
        <template v-if="user">
            <UserPreview :user="user" />
        </template>
        <section v-if="topics && topics.length > 0" class="box column g-2 p-3">
            <div class="row g-1" v-for="topic in topics">
                <Votes :target="topic" />
                <Tag class="f-1 b-0" type="link" :label="extractId(topic.id)" />
                <DurationTag v-if="topic.firstUsed" width="6rem" :time="topic.firstUsed" />
            </div>
        </section>
        <footer v-else class="box empty-state">
            <p>This user isn't following any topics.</p>
        </footer>
    </article>
</template>
