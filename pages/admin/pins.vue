<script setup lang="ts">
import type { Pin, Post, User } from '~/types'

const session = getSession()

const { data: pins, refresh } = await useFetch<Pin[]>("/api/admin/pin", {
    headers: {
        Authorization: session.tokens.access,
    },
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
    <article class="p-4">
        <section class="column g-4" v-if="pins!.length > 0">
            <div class="box" v-for="pin in pins" :key="pin.id">
                <PostPreview :post="pin.post"  />
                <header class="row g-1 p-3">
                    <UserTag :user="pin.user" />
                    <DurationTag :time="pin.time" />
                    <Tag type="danger" icon="fa-trash-can" label="Remove" @click="deletePin(pin)" />
                    <Toggle class="toggle ml-2" :enabled="pin.active" @update:enabled="updatePin(pin)">
                        <template #label>
                            <span>Active</span>
                        </template>
                    </Toggle>
                </header>
            </div>
        </section>
        <section class="box p-3" v-else>
            <p>There are currently no pins...</p>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}

header {
    border-top: 1px solid $white-2;
}

.toggle {
    span {
        font-weight: 700;
    }
}

section.box {
    p {
        text-align: center;
    }
}
</style>