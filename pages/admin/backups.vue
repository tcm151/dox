<script setup lang="ts">
import { DateTime } from 'luxon'

const hints = useHints()
const session = getSession()

const { data: backups, refresh } = useAsyncData('backups', () => {
    return $fetch("/api/admin/backup", {
        headers: {
            Authorization: `Bearer ${session.token}`,
        }
    })
})

let backupInterval = ref<number>(24)

async function startBackup() {
    try {
        console.log(await session.useApi("/api/admin/backup/start"))
        hints.addSuccess(`Backup created at ${DateTime.now().toLocaleString(DateTime.DATETIME_FULL)}`)
        await refresh()
    }
    catch (error: any) {
        console.log(error.message)
        hints.addError("Backup FAILED!")
    }
}
</script>

<template>
    <article class="p-4">
        <section class="column g-4 p-4">
            <header class="row g-2">
                <div class="field">
                    <input v-model="backupInterval" style="width: 64px; text-align: center">
                </div>
                <button
                    class="fill"
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
                    <span class="fill tag link">{{ backup.id }}</span>
                    <span class="tag info">{{ formatDate(backup.time) }}</span>
                    <span class="tag info">u/{{ backup.user.name }}</span>
                </div>
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(500px, 1rem);
}

section {
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;
}
</style>

