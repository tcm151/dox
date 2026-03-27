<script setup lang="ts">
const hints = useHints()

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

function addTopic() {
    if (validTopic()) {
        emit("add", props.input)
    }
    else {
        hints.addError("That is an invalid topic.")
    }
}
</script>

<template>
    <div class="field topic-input" :class="{ 'invalid': !validTopic() }">
        <div class="row inline g-2 mb-2">
            <label class="mb-0">Topics</label>
            <TopicTag v-for="topic in topics" :topic="topic" disable @contextmenu.prevent="emit('remove', topic)" />
        </div>
        <input
            type="text"
            spellcheck="false"
            placeholder="press enter to add . . ."
            :value="input"
            @input="emit('update:input', ($event.target as HTMLInputElement).value)"
            @keyup.enter="addTopic"
            @focus="focused = true"
            @blur="focused = false"
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

</style>