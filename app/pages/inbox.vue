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

const dismissing = ref<boolean>(false)
const showDismissed = ref<boolean>(false)
const loadingMore = ref<boolean>(false)
const pageSize = 20
const { data: result, pending, refresh } = await useAuthenticatedDatasource<NotificationPage>("/api/profile/notifications", {
    query: {
        dismissed: showDismissed,
        pageSize,
        offset: 0,
    }
})

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

async function loadMore() {
    const currentPage = result.value
    if (!currentPage?.more || loadingMore.value) return

    const requestedDismissed = showDismissed.value
    const requestedOffset = currentPage.offset + pageSize
    loadingMore.value = true
    try {
        const page = await $fetch<NotificationPage>("/api/profile/notifications", {
            headers: { Authorization: getSession().tokens.access },
            query: {
                dismissed: requestedDismissed,
                pageSize,
                offset: requestedOffset,
            },
        })

        if (requestedDismissed !== showDismissed.value || currentPage !== result.value) return

        const loadedIds = new Set(currentPage.items.map(notification => notification.id))
        result.value = {
            ...page,
            items: [...currentPage.items, ...page.items.filter(notification => !loadedIds.has(notification.id))],
        }
    }
    catch (error: any) {
        hints.addError(error.message, error)
    }
    finally {
        loadingMore.value = false
    }
}

</script>

<template>
    <article class="content-width p-4">
        <header class="row end g-2 mb-2">
            <ButtonSpinner class="dark f-1" :loading="pending" @click="refresh">
                <i class="fa-solid fa-refresh"></i>
                Refresh
            </ButtonSpinner>
            <ButtonSpinner v-if="!showDismissed && result && result.total > 0" class="dark" :loading="dismissing" @click="dismissAll">
                <i class="fa-solid fa-angles-right"></i>
                Dismiss All
            </ButtonSpinner>
            <div class="box px-4 py-2">
                <Toggle v-model:enabled="showDismissed" label="Show Dismissed" />
            </div>
        </header>
        <section v-if="result && result.total > 0" class="column g-2">
            <TransitionGroup name="notifications">
                <template v-for="notification in result.items" :key="notification.id">
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
            <template v-if="result.more">
                <button class="link" :disabled="loadingMore || pending" @click="loadMore">
                    <i class="fa-solid fa-angles-down"></i>
                    {{ loadingMore ? "Loading..." : "Load More" }}
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