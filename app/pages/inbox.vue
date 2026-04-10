<script setup lang="ts">
import type { Notification } from '@@/shared/types'

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

const pageAmount = ref<number>(5)

const showDismissed = ref<boolean>(false)
const notificationAmount = ref<number>(pageAmount.value)
const { data: result, pending, refresh } = await useDatasource<{ total: number, notifications: Notification[] }>("/api/profile/notifications", {
    query: {
        dismissed: showDismissed,
        amount: notificationAmount,
    }
})

async function dismissAll() {
    await useApi(`/api/profile/notifications/dismiss`)
    await refresh()
}

function viewContext(notification: Notification) {
    return navigateTo(`/${(notification.context as string).replace(':', '/')}`)
}

async function dismiss(notification: Notification) {
    await useApi(`/api/profile/notifications/${extractId(notification.id)}/dismiss`)
    await refresh()
}

function loadMore() {
    notificationAmount.value += pageAmount.value
}

// TODO implement real-time notifications with WebSockets or Server-Sent Events for immediate user feedback on new interactions.
</script>

<template>
    <article class="p-4">
        <header class="row end g-2 mb-2">
            <ButtonSpinner class="dark f-1" :loading="pending" @click="refresh">
                <i class="fa-solid fa-refresh"></i>
                Refresh
            </ButtonSpinner>
            <button class="dark" @click="dismissAll">
                <i class="fa-solid fa-angles-right"></i>
                Dismiss All
            </button>
            <div class="box px-4 py-2">
                <Toggle v-model:enabled="showDismissed" label="Show Dismissed" />
            </div>
        </header>
        <section v-if="result && result.total > 0" class="column g-2">
            <TransitionGroup name="notifications">
                <div class="notification box p-4" v-for="notification in result.notifications" :key="notification.id">
                    <Markdown class="message column" :content="notification.message" />
                    <div class="row g-1 mt-3">
                        <DurationTag :time="notification.time" />
                        <Tag type="link" icon="fa-eye" label="Context" @click="viewContext(notification)" />
                        <template v-if="!notification.viewed">
                            <Tag type="danger" icon="fa-angle-right" label="Dismiss" @click="dismiss(notification)" />
                        </template>
                    </div>
                </div>
            </TransitionGroup>
            <template v-if="result.total > result.notifications.length">
                <button class="link" @click="loadMore">
                    <i class="fa-solid fa-angles-down"></i>
                    Load More
                </button>
            </template>
        </section>
        <section class="column center box p-4" v-else>
            <p>You have no unread notifications.</p>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width (60rem, 1rem);
}

.notifications-move, .notifications-enter-active, .notifications-leave-active {
    transition: all 256ms ease;
}

.notifications-enter-from,
.notifications-leave-to {
    opacity: 0;
}
</style>