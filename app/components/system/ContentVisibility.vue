<script setup lang="ts">
import type { ContentVisibilityMode } from "@@/shared/types"

const props = withDefaults(defineProps<{
    tags?: string[]
    direct?: boolean
}>(), {
    tags: () => [],
    direct: false,
})

const settings = useSettings()
const userSettings = useUserSettings()

function appVisibilityMode(tag: string) {
    if (tag === "nsfw" || tag === "spoiler") return settings.app.content.visibility[tag]
}

const revealed = ref(false)
const mode = computed(() => {
    let visibility: ContentVisibilityMode = "show"

    for (const tag of props.tags) {
        const tagMode = userSettings.preferences.content.visibility[tag] ?? appVisibilityMode(tag)
        if (tagMode === "filter") return "filter"
        if (tagMode === "mask") visibility = "mask"
    }

    return visibility
})

watch(mode, () => {
    revealed.value = false
})

const tagLabels = computed(() => props.tags.join(", "))

</script>

<template>
    <template v-if="mode !== 'filter' || direct">
        <template v-if="mode !== 'show' && !revealed">
            <section class="box column g-2 py-3" @click.stop>
                <button type="button" class="small warning" @click.stop="revealed = true">
                    Reveal {{ tagLabels }}
                </button>
            </section>
        </template>
        <template v-else>
            <slot />
        </template>
    </template>
</template>
