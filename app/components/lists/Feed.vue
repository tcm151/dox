<script setup lang="ts" generic="T extends { id: string }">
import type { FeedDatasource } from "@@/app/utils/feedDatasource"

const props = defineProps<{
    items: FeedDatasource<T>
}>()

const settings = useSettings()
const userSettings = useUserSettings()

const sortType = props.items.sortBy

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(tag => typeof tag === "string")
}

function contentTags(item: T): readonly string[] {
    if ("tags" in item && isStringArray(item.tags)) return item.tags
    if ("context" in item && item.context && typeof item.context === "object" && "tags" in item.context && isStringArray(item.context.tags)) {
        return item.context.tags
    }
    return []
}

function appVisibilityMode(tag: string) {
    if (tag === "nsfw" || tag === "spoiler") return settings.app.content.visibility[tag]
}

const visibleItems = computed(() => (props.items.data.value ?? []).filter(item =>
    !contentTags(item).some(tag => (userSettings.preferences.content.visibility[tag] ?? appVisibilityMode(tag) ?? "show") === "filter"),
))
const showLoading = computed(() => !visibleItems.value.length && ["idle", "pending"].includes(props.items.status.value))
const showError = computed(() => !visibleItems.value.length && props.items.status.value === "error")
const showEmpty = computed(() => !visibleItems.value.length && props.items.status.value === "success")

const spinRefresh = ref(false)
watch(() => props.items.status.value, (status) => {
    if (status == "pending") {
        spinRefresh.value = true
    }
    else {
        setTimeout(() => spinRefresh.value = false, 512)
    }
})
</script>

<template>
    <section class="column g-2">
        <header v-if="items.sorting" class="sorting row fill center g-2">
            <button class="refresh dark" @click="items.refresh()">
                <i class="fa-solid fa-rotate" :class="{ spin: spinRefresh }"></i>
            </button>
            <ClientOnly>
                <slot name="buttons" />
                <button :class="{ selected: sortType === 'new' }" title="New" @click="items.setSort('new')">
                    <i class="fa-solid fa-egg"></i>
                    <span>New</span>
                </button>
                <button :class="{ selected: sortType === 'hot' }" title="Hot" @click="items.setSort('hot')">
                    <i class="fa-solid fa-fire"></i>
                    <span>Hot</span>
                </button>
                <button :class="{ selected: sortType === 'top' }" title="Top" @click="items.setSort('top')">
                    <i class="fa-solid fa-ranking-star"></i>
                    <span>Top</span>
                </button>
            </ClientOnly>
        </header>
        <ClientOnly>
            <TransitionGroup name="feed" tag="div" class="feed-items column g-2">
                <div v-for="item in visibleItems" :key="item.id" class="feed-item">
                    <slot name="item" v-bind="(item as T)" />
                </div>
                <div v-if="showLoading" key="loading" class="box empty-state stacked" role="status">
                    <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                    <span>Loading feed...</span>
                </div>
                <div v-else-if="showError" key="error" class="box empty-state stacked" role="alert">
                    <span>Unable to load this feed.</span>
                    <button class="link" @click="items.refresh()">Retry</button>
                </div>
                <div v-else-if="showEmpty" key="empty" class="box empty-state stacked">
                    {{ props.items.data.value?.length ? "No content matches your visibility preferences." : "There is nothing here currently." }}
                </div>
            </TransitionGroup>
        </ClientOnly>
        <button v-if="items.more.value" class="link" :disabled="items.loading.value || items.pending.value" @click="items.loadMore()">
            <i class="fa-solid fa-angles-down"></i>
            {{ items.loading.value ? "Loading..." : "Load More" }}
        </button>
    </section>
</template>

<style scoped lang="scss">

header.sorting {
    button:not(.refresh, .selected), :slotted(button) {
        @media (min-width: $bp-compact) {
            span {
                display: none;
            }    
        }
    }

    .selected {
        color: $white-0;
        background-color: $white-3;
    }
}

.feed-items {
    position: relative;
}

.feed-item {
    width: 100%;
}

.feed-move {
    transition: transform var(--motion-duration-fast) var(--motion-easing-standard);
}

.feed-enter-active,
.feed-leave-active {
    transition: opacity var(--motion-duration-fast) var(--motion-easing-standard), transform var(--motion-duration-fast) var(--motion-easing-standard);
}

.feed-enter-from,
.feed-leave-to {
    opacity: 0;
    transform: translateY(0.25rem);
}

.feed-leave-active {
    position: absolute;
    right: 0;
    left: 0;
}
</style>