<script setup lang="ts" generic="T extends { id: string }">
import type { FetchError } from "ofetch"
import type { AsyncData } from "#app";

const props = defineProps<{
    items: Pick<AsyncData<T[] | undefined, FetchError<any> | undefined>, "data" | "status" | "refresh">
    sorting?: boolean
}>()

const emit = defineEmits<{
    (event: 'refresh', sortBy: string): void
}>()

const cache = useCache()
const settings = useSettings()
const userSettings = useUserSettings()

let sortType = cache.get("feed.sort", () => "new")

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(tag => typeof tag === "string")
}

function contentTags(item: T): readonly string[] {
    if ("tags" in item && isStringArray(item.tags)) return item.tags
    if (
        "context" in item
        && item.context
        && typeof item.context === "object"
        && "tags" in item.context
        && isStringArray(item.context.tags)
    ) {
        return item.context.tags
    }
    return []
}

function appVisibilityMode(tag: string) {
    if (tag === "nsfw" || tag === "spoiler") return settings.app.content.visibility[tag]
}

const visibleItems = computed(() => (props.items.data.value ?? []).filter(item =>
    !contentTags(item).some(tag =>
        (userSettings.preferences.content.visibility[tag]
            ?? appVisibilityMode(tag)
            ?? "show") === "filter",
    ),
))

const spinRefresh = ref(false)
watch(() => props.items.status.value, (status) => {
    if (status == "pending") {
        spinRefresh.value = true
    }
    else {
        setTimeout(() => spinRefresh.value = false, 512)
    }
})

function sortFeed(type: string) {
    sortType.value = type
    emit("refresh", sortType.value)
}
</script>

<template>
    <section v-if="items" class="column g-2">
        <header v-if="props.sorting" class="sorting row center g-2">
            <button class="refresh dark" @click="items.refresh()">
                <i class="fa-solid fa-rotate" :class="{ spin: spinRefresh }"></i>
            </button>
            <ClientOnly>
                <slot name="buttons" />
                <button @click="sortFeed('new')" :class="{ selected: sortType === 'new' }">
                    <i class="fa-solid fa-egg"></i>
                    <span>New</span>
                </button>
                <button @click="sortFeed('hot')" :class="{ selected: sortType === 'hot' }">
                    <i class="fa-solid fa-fire"></i>
                    <span>Hot</span>
                </button>
                <button @click="sortFeed('top')" :class="{ selected: sortType === 'top' }">
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
                <div v-if="!visibleItems.length" key="empty" class="box empty-state stacked">
                    {{ props.items.data.value?.length ? "No content matches your visibility preferences." : "There is nothing here currently." }}
                </div>
            </TransitionGroup>
        </ClientOnly>
    </section>
</template>

<style scoped lang="scss">

header.sorting {
    button:not(.refresh), :slotted(button) {
        flex: 1 1;
        
        @media (max-width: $bp-compact) {
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