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

async function deletePin(pin: Pin) {
    await session.useApi<Pin>(`/api/admin/pin/${extractId(pin.id)}/delete`)
    await refresh()
}
</script>

<template>
    <article class="column g-4 p-4">
        <div class="box" v-for="pin in pins" :key="pin.id">
            <PostPreview :post="(pin.post as Post)"  />
            <header class="row g-1 p-3">
                <UserTag :user="(pin.user as User)" />
                <TimeTag :time="pin.time" />
                <Tag type="danger" icon="fa-trash-can" label="Remove" @click="deletePin(pin)" />
                <Toggle class="toggle ml-2" :enabled="pin.active" @update:enabled="updatePin(pin)">
                    <template #label>
                        <span>Active</span>
                    </template>
                </Toggle>
            </header>
        </div>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(800px, 1rem);
}

header {
    border-top: 1px solid $dox-white-2;
}

.toggle {
    span {
        font-weight: 700;
    }
}
</style>