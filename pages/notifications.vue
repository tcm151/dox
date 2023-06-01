<script setup lang="ts">
import { Notification } from '~/types'

const session = getSession();
let notifications = ref(await session.useApi<Notification[]>("/api/profile/notifications"));

async function dismiss(notification: Notification) {
    notifications.value = notifications.value!.filter(n => n.id !== notification.id)
    await session.useApi(`/api/profile/notifications/${extractId(notification.id)}/dismiss`, notification)
}
</script>

<template>
    <article class="notifications column g-2 p-4">
        <ClientOnly>
            <div class="notification p-4" v-for="notification in notifications">
                <Markdown class="message column g-2" :content="notification.message" />
                <div class="row-fit g-2 mt-2">
                    <span class="tag link">Context</span>
                    <span class="tag info">{{ formatDate(notification.time) }}</span>
                    <span class="tag danger" @click="dismiss(notification)">Dismiss</span>
                </div>
            </div>
        </ClientOnly>
    </article>
</template>

<style scoped lang="scss">
article.notifications {
    width: calc(100% - 2rem);
    max-width: 800px;
}

.notification {
    background-color: $dox-white-ultra;
    border-radius: 0.25rem;
}
</style>