<script setup lang="ts">
const tags = defineModel<string[]>({ default: () => [] })

const options = [
    { value: 'nsfw', label: 'NSFW' },
    { value: 'spoiler', label: 'Spoiler' },
]

function toggle(tag: string) {
    tags.value = tags.value.includes(tag)
        ? tags.value.filter(value => value !== tag)
        : [...tags.value, tag]
}
</script>

<template>
    <div class="row g-2">
        <template v-for="tag in options" :key="tag.value">
            <button type="button" class="tag" :class="{ danger: tags.includes(tag.value) }" @click="toggle(tag.value)">
                {{ tag.label }}
            </button>
        </template>
    </div>
</template>
