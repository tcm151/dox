<script setup lang="ts">
import { DateTime } from 'luxon'

const hints = useHints()
const session = getSession()

const { data: backups, refresh } = await useFetch<any[]>("/api/developer/backup")

let backupInterval = ref<number>(24)

async function startBackup() {
    await session.useApi("/api/developer/backup/start")
    hints.addSuccess(`Backup created at ${DateTime.now().toLocaleString(DateTime.DATETIME_FULL)}`)
    await refresh()
}
</script>

<template>
    <article class="p-4">
        <section class="column box g-4 p-4">
            <header class="row g-2">
                <div class="field">
                    <input v-model="backupInterval" style="width: 64px; text-align: center">
                </div>
                <button
                    class="f-1"
                    @click="startBackup"
                    :class="{
                        success: !backups?.every(b => elapsedTime(b.time, 'hours').hours >= backupInterval),
                        danger: backups?.every(b => elapsedTime(b.time, 'hours').hours > backupInterval),
                    }"
                >
                    <i class="fa-solid fa-floppy-disk"></i>
                    <span>Backup Now</span>
                </button>
            </header>
            <div class="column g-2">
                <div class="fit row g-2" v-for="backup in backups">
                    <Tag class="f-1" type="info" icon="fa-stopwatch" :label="formatDate(backup.time)" />
                    <UserTag width="6rem" :user="backup.user" />
                    <Tag class="f-1" type="link" :label="backup.id" />
                </div>
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>

