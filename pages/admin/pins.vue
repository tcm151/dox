<script setup lang="ts">
import type { Pin, Post, User } from '~/types'

const session = getSession()

const { data: pins, pending, refresh } = useAsyncData('pins', () => {
    return session.useApi<Pin[]>("/api/admin/pin")
})

async function updatePin(pin: Pin) {
    await session.useApi<Pin>(`/api/admin/pin/${extractId(pin.id)}/update`, {
        active: !pin.active
    })
    await refresh()
}

</script>

<template>
    <article class="column p-4">
        <div class="box" v-for="pin in pins" :key="pin.id">
            <header class="row g-1 p-3">
                <UserTag :user="((pin.post as Post).user as User)" />
                <TimeTag :time="(pin.post as Post).time" />
                <Toggle class="ml-2" :enabled="pin.active" @update:enabled="updatePin(pin)" label="Active" />
            </header>
            <hr>
            <PostPreview :post="(pin.post as Post)"  />
        </div>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(800px, 1rem);
}

hr {
    margin: 0;
    border: 1px solid $dox-white-1;
}
</style>