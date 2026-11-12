<script setup lang="ts">
import type { Pin } from '@@/shared/types'

const hints = useHints()
const route = useRoute()
const id = route.params.topic?.toString()

const { data: pins, pending, refresh } = await useAuthenticatedDatasource<Pin[]>(`/api/topic/${id}/pins/manage`)

async function updatePin(pin: Pin) {
    try {
        await useApi<boolean>(`/api/topic/${id}/pins/${extractId(pin.id)}/update`, {
            body: { active: !pin.active },
        })
        await refresh()
    }
    catch (error: any) {
        hints.addError("Failed to update topic pin.", error)
    }
}

async function deletePin(pin: Pin) {
    try {
        await useApi(`/api/topic/${id}/pins/${extractId(pin.id)}/delete`)
        await refresh()
    }
    catch (error: any) {
        hints.addError("Failed to remove topic pin.", error)
    }
}
</script>

<template>
    <article class="content-width column g-2 p-4">
        <header class="row wrap inline between g-2">
            <h1>Pins</h1>
            <ButtonSpinner class="dark" :loading="pending" @click="refresh()">
                <i class="fa-solid fa-rotate"></i>
                <span>Refresh</span>
            </ButtonSpinner>
        </header>
        <section v-if="pins && pins.length > 0" class="column g-4">
            <article v-for="pin in pins" :key="pin.id" class="box">
                <MultiPreview :item="pin.item" pinned />
                <header class="row g-1 p-3">
                    <UserTag :user="pin.user" />
                    <DurationTag :time="pin.time" />
                    <Tag type="danger" icon="fa-trash-can" label="Remove" @click="deletePin(pin)" />
                    <Toggle class="toggle ml-2" :enabled="pin.active" @update:enabled="updatePin(pin)">
                        <template #label>
                            <span class="text bold">Active</span>
                        </template>
                    </Toggle>
                </header>
            </article>
        </section>
        <section v-else-if="pins" class="box empty-state" aria-live="polite">
            <p>There are currently no pins.</p>
        </section>
    </article>
</template>