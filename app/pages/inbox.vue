<script setup lang="ts">
import type { Notification, NotificationPage } from '@@/shared/types'

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

const hints = useHints()

const showDismissed = ref<boolean>(false)
const { data: notifications, pending, refresh } = await useAuthenticatedDatasource<NotificationPage>("/api/profile/notifications", {
    query: {
        dismissed: showDismissed,
        pageSize: 20,
        offset: 0,
    }
})

const dismissing = ref<boolean>(false)
async function dismissAll() {
    if (dismissing.value) return

    dismissing.value = true
    try {
        await useApi(`/api/profile/notifications/dismiss`)
    }
    catch (error: any) {
        hints.addError(error.message, error)
        return
    }
    finally {
        dismissing.value = false
    }

    await refresh()
}

function viewContext(notification: Notification) {
    const context = notification.context as string
    const reportId = context.startsWith("report:") ? extractId(context) : undefined
    if (reportId) return navigateTo(`/appeal/${reportId}`)
    if (context.startsWith("comment:")) return navigateTo(`/comment/${extractId(context)}`)

    return navigateTo(`/${context.replace(":", "/")}`)
}

function contextLabel(notification: Notification) {
    const context = notification.context as string
    const contextType = context.split(":", 1)[0] ?? ""
    const labels: Record<string, string> = {
        comment: "Comment",
        gallery: "Gallery",
        image: "Image",
        post: "Post",
        report: "Appeal",
        thread: "Thread",
        topic: "Topic",
        user: "Profile",
    }

    return labels[contextType] ?? "Context"
}

async function dismiss(notification: Notification) {
    try {
        await useApi(`/api/profile/notifications/${extractId(notification.id)}/dismiss`)
        await refresh()
    }
    catch (error: any) {
        hints.addError(error.message, error)
    }
}

const loading = ref<boolean>(false)
async function loadMore() {
    const currentPage = notifications.value
    if (!currentPage?.more || loading.value) return

    const requestedDismissed = showDismissed.value
    const requestedOffset = currentPage.offset + 20
    loading.value = true
    try {
        const page = await $fetch<NotificationPage>("/api/profile/notifications", {
            headers: { Authorization: getSession().tokens.access },
            query: {
                dismissed: requestedDismissed,
                pageSize: 20,
                offset: requestedOffset,
            },
        })

        if (requestedDismissed !== showDismissed.value || currentPage !== notifications.value) return

        const loadedIds = new Set(currentPage.items.map(notification => notification.id))
        notifications.value = {
            ...page,
            items: [...currentPage.items, ...page.items.filter(notification => !loadedIds.has(notification.id))],
        }
    }
    catch (error: any) {
        hints.addError(error.message, error)
    }
    finally {
        loading.value = false
    }
}

</script>

<template>
    <article v-if="notifications" class="content-width p-4">
        <header class="row inline between g-2 mb-2">
            <h1>Inbox</h1>
            <div class="row g-2">
                <!-- TODO need a better way to display this on mobile -->
                <div class="box px-4 py-2">
                    <Toggle v-model:enabled="showDismissed" label="Show All" />
                </div>
                <ButtonSpinner v-if="notifications.total > 0" class="dark" :loading="dismissing" @click="dismissAll">
                    <i class="fa-solid fa-angles-right"></i>
                    <span>Dismiss Unread</span>
                </ButtonSpinner>
                <ButtonSpinner class="dark" :loading="pending" @click="refresh">
                    <i class="fa-solid fa-refresh"></i>
                    <span>Refresh</span>
                </ButtonSpinner>
            </div>
        </header>
        <section v-if="notifications.total > 0" class="column g-2">
            <TransitionGroup name="notifications">
                <template v-for="notification in notifications.items" :key="notification.id">
                    <article class="box p-4">
                        <Markdown class="column" :content="notification.message" />
                        <footer class="row g-1 mt-3">
                            <DurationTag :time="notification.time" />
                            <Tag type="link" icon="fa-eye" :label="contextLabel(notification)" @click="viewContext(notification)" />
                            <Tag v-if="!notification.viewed" type="danger" icon="fa-angles-right" label="Dismiss" @click="dismiss(notification)" />
                        </footer>
                    </article>
                </template>
            </TransitionGroup>
            <template v-if="notifications.more">
                <button class="link" :disabled="loading || pending" @click="loadMore">
                    <i class="fa-solid fa-angles-down"></i>
                    {{ loading ? "Loading..." : "Load More" }}
                </button>
            </template>
        </section>
        <section class="box empty-state stacked" v-else>
            <p>{{ showDismissed ? "You don't have any notifications." : "You have no unread notifications." }}</p>
        </section>
    </article>
</template>

<style scoped lang="scss">
.notifications-move {
    transition: transform var(--motion-duration-standard) var(--motion-easing-standard);
}

.notifications-enter-active,
.notifications-leave-active {
    transition: opacity var(--motion-duration-standard) var(--motion-easing-standard);
}

.notifications-enter-from,
.notifications-leave-to {
    opacity: 0;
}
</style>