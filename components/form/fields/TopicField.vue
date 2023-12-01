<script setup lang="ts">
const props = defineProps<{
    topics: string[]
    input: string
}>()

const emit = defineEmits<{
    (event: 'add', topic: string): void
    (event: 'update:input', field: string): void
    (event: 'remove', topic: string): void
}>()

const focused = ref<boolean>(false)

const valid = useValidation()
function validTopic() {
    return props.input !== '' ? valid.topic.test(props.input) : true
}
</script>

<template>
    <div class="field topic-input">
        <div class="row center-inline g-2 mb-2">
            <label class="mb-0">Topics</label>
            <TopicTag v-for="topic in topics" :topic="topic" @contextmenu.prevent="emit('remove', topic)" />
        </div>
        <input
            type="text"
            spellcheck="false"
            placeholder="press enter to add . . ."
            :value="input"
            @input="emit('update:input', ($event.target as HTMLInputElement).value)"
            @keyup.enter="emit('add', input)"
            @focus="focused = true"
            @blur="focused = false"
            :class="{ 'invalid': focused && !validTopic() }"
        />
    </div>
</template>

<style scoped lang="scss">
div.row {
    width: min-content;
    
    label {
        vertical-align: middle;
        line-height: 1.5rem;
    }
}

input.invalid {
    outline: 1px solid $dox-red !important;
}
</style>