<script setup lang="ts">
import type { Notification } from '~/types'

definePageMeta({
    middleware: (to, from) => {
        if (ENV.isClient()) {
            const session = getSession()
            if (to.path.startsWith("/inbox") && !session.isAuthenticated) {
                return abortNavigation()
            }
        }
    }
})

const { data: notifications } = await useDatasource<Notification[]>("/api/profile/notifications")

function viewContext(notification: Notification) {
    navigateTo(`/${(notification.context as string).replace(':', '/')}`)
}

async function dismiss(notification: Notification) {
    notifications.value = notifications.value?.filter(n => n.id !== notification.id)
    await useApi(`/api/profile/notifications/${extractId(notification.id)}/dismiss`)
}
</script>

<template>
    <article class="notifications p-4">
        <section class="column g-2" v-if="notifications && notifications.length > 0">
            <TransitionGroup name="notifications">
                <div class="notification box p-4" v-for="notification in notifications" :key="notification.id">
                    <Markdown class="message column" :content="notification.message" />
                    <div class="row g-2 mt-3">
                        <DurationTag :time="notification.time" />
                        <Tag type="link" icon="fa-link" label="Context" @click="viewContext(notification)" />
                        <Tag type="danger" label="Dismiss" @click="dismiss(notification)" />
                    </div>
                </div>
            </TransitionGroup>
        </section>
        <section class="column center box p-4" v-else>
            <p>You have no unread notifications.</p>
        </section>
    </article>
</template>

<style scoped lang="scss">
article.notifications {
    width: calc(100% - 2rem);
    max-width: 800px;
}

section.empty {
    text-align: center;
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