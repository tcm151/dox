<script setup lang="ts">
import type { User } from "@@/shared/types"

const route = useRoute()

const id = route.params.id?.toString()
const { data: user } = useNuxtData<User>(`user:${id}`)
const { data: followers } = await useDatasource<User[]>(`/api/user/${id}/followers`)
</script>

<template>
    <article class="column g-2 p-4">
        <template v-if="user">
            <UserPreview :user="user" />
        </template>
        <section v-if="followers && followers.length > 0" class="box column g-2 p-3">
            <div class="row g-1" v-for="user in followers">
                <Votes :target="user" />
                <UserTag class="f-1 b-0" :user="user" />
                <DurationTag width="6rem" :time="user.dateJoined" />
            </div>
        </section>
        <footer v-else class="box p-3 text center">
            <p>This user doesn't have any followers.</p>
        </footer>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>