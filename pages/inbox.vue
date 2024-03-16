<script setup lang="ts">
import type { Notification } from '~/types'

definePageMeta({
    middleware: (to, from) => {
        if (process.client) {
            const session = getSession()
            if (to.path.startsWith("/inbox") && !session.isAuthenticated) {
                return abortNavigation()
            }
        }
    }
})

const session = getSession();
let notifications = ref<Notification[] | null>(null);

onMounted(async () => {
    if (process.client) {
        notifications.value = await session.useApi<Notification[]>("/api/profile/notifications")
    }
})

function viewContext(notification: Notification) {
    navigateTo(`/${(notification.context as string).replace(':', '/')}`)
}

async function dismiss(notification: Notification) {
    notifications.value = notifications.value!.filter(n => n.id !== notification.id)
    await session.useApi(`/api/profile/notifications/${extractId(notification.id)}/dismiss`, notification)
}
</script>

<template>
    <article class="notifications p-4">
        <section class="column g-2" v-if="notifications && notifications.length > 0">
            <TransitionGroup name="notifications">
                <div class="notification p-4" v-for="notification in notifications" :key="notification.id">
                    <Markdown class="message column" :content="notification.message" />
                    <div class="row-fit g-2 mt-3">
                        <TimeTag :time="notification.time" />
                        <Tag type="link" icon="fa-link" label="Context" @click="viewContext(notification)" />
                        <Tag type="danger" label="Dismiss" @click="dismiss(notification)" />
                    </div>
                </div>
            </TransitionGroup>
        </section>
        <section class="empty p-4" v-else>
            <p>You have no unread notifications.</p>
        </section>
    </article>
</template>

<style scoped lang="scss">
article.notifications {
    width: calc(100% - 2rem);
    max-width: 800px;
}

.notification {
    border-radius: 0.25rem;
    background-color: $dox-white-0;
}

section.empty {
    text-align: center;
    border-radius: 0.25rem;
    background-color: $dox-white-0;
}

.notifications-move, .notifications-enter-active, .notifications-leave-active {
    transition: all 256ms ease;
}

.notifications-enter-from,
.notifications-leave-to {
    opacity: 0;
}

// .notifications-leave-active {
//     position: absolute;
// }
</style>