<script setup lang="ts">
import { Notification } from '~/types'

const session = getSession();
let notifications = ref(await session.useApi<Notification[]>("/api/profile/notifications"));

async function dismiss(notification: Notification) {
    notifications.value = notifications.value!.filter(n => n.id !== notification.id)
    await session.useApi(`/api/profile/notifications/${getId(notification.id)}/dismiss`, notification)
}
</script>

<template>
    <section id="notifications" class="column g-2">
        <ClientOnly>
            <div class="notification" v-for="notification in notifications">
                <div class="message" v-html="renderMarkdown(notification.message)">
                </div>
                <div class="row-fit g-2 mt-2">
                    <span class="link">Context</span>
                    <span class="info">{{ formatDate(notification.time) }}</span>
                    <span class="danger" @click="dismiss(notification)">Dismiss</span>
                </div>
            </div>
        </ClientOnly>
    </section>
</template>

<style lang="scss">
.message {
    blockquote {
        padding: 0.5rem !important;
    }
}
</style>

<style scoped lang="scss">
#notifications {
    width: calc(100% - 2rem);
    max-width: 800px;
}

.notification {
    background-color: $dox-white-ultra;
    border-radius: 0.25rem;
    padding: 1rem;

    span {
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-weight: 700;
        cursor: pointer;
    }
}

.message {
    @include flex-v (0.5rem);
}
</style>