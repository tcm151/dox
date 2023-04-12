<script setup lang="ts">
import { storeToRefs } from 'pinia';

const props = defineProps<{
    visible: boolean
}>()

const emit = defineEmits<{
    (event: 'close'): void
}>()

const { settings } = storeToRefs(useQuery())

</script>

<template>
    <ClientOnly>
        <Window
            title="Settings"
            :width="400"
            :visible="visible"
            @close="emit('close')"
        >
        <section class="settings column g-2">
                <div class="field">
                    <label>Host</label>
                    <input type="text" v-model="settings.host">
                </div>
                <div class="field">
                    <label>Namespace</label>
                    <input type="text" v-model="settings.namespace">
                </div>
                <div class="field">
                    <label>Database</label>
                    <input type="text" v-model="settings.database">
                </div>
                <div class="field">
                    <label>Username</label>
                    <input type="text" v-model="settings.username">
                </div>
                <div class="field">
                    <label>Password</label>
                    <input type="password" v-model="settings.password">
                </div>
            </section>
        </Window>
    </ClientOnly>
</template>

<style scoped lang="scss">

section {
    min-height: 256px;
}

</style>