<script setup lang="ts">
import type { Pin } from '~/types'

const { data: pins, refresh } = await useDatasource<Pin[]>("/api/admin/pin")

async function updatePin(pin: Pin) {
    await useApi<Pin>(`/api/admin/pin/${extractId(pin.id)}/update`, {
        body: {
            active: !pin.active
        }
    })
    await refresh()
}

async function deletePin(pin: Pin) {
    await useApi<Pin>(`/api/admin/pin/${extractId(pin.id)}/delete`)
    await refresh()
}
</script>

<template>
    <article class="p-4 fit-large">
        <section class="column g-4" v-if="pins!.length > 0">
            <div class="box" v-for="pin in pins" :key="pin.id">
                <MultiPreview :item="pin.item" />
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
        <section class="box p-3 text-center" v-else>
            <p>There are currently no pins.</p>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
}

header {
    border-top: 1px solid $white-2;
}

.toggle {
    span {
        font-weight: 700;
    }
}
</style>