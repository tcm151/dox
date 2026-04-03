<script setup lang="ts">
import type { Topic } from '@@/shared/types';

const hints = useHints()
const settings = useSettings()

const props = defineProps<{
    topics: string[]
}>()

const text = defineModel<string>()

const emit = defineEmits<{
    (event: 'add', topic: string): void
    (event: 'remove', topic: string): void
}>()


const valid = useValidation()
function validTopic() {
    return (text.value && text.value !== '') ? valid.topic.name(text.value) : true
}

const { data: available } = await useDatasource<Topic[]>("/api/topic/available")

const inputFocused = ref<boolean>(false)
const matchingResults = computed(() => {
    if (text.value && text.value.length > 0) {
        return available.value!.filter(t => extractId(t.id)?.toLowerCase().includes(text.value!.toLowerCase()))
    }
    else {
        return []
    }
})

function addTopic() {
    if (props.topics.length >= settings.app.topics.perSubmission) {
        hints.addError(`You can only add ${settings.app.topics.perSubmission} topics per submission.`)
        text.value = ""
        return
    }
    if (settings.app.topics.restrict && !settings.app.topics.allowed.includes(`topic:${text.value}`)) {
        hints.addError("You must use one of the predefined topics.")
        return
    }
    if (text.value && validTopic()) {
        emit("add", text.value)
        text.value = ""
    }
    else {
        hints.addError("That is an invalid topic.")
    }
}

function useTopic(topic: string | undefined) {
    if (topic) {
        text.value = topic
        addTopic()
    }
}
</script>

<template>
    <main class="field" :class="{ 'invalid': !validTopic() }">
        <div class="row inline g-2 mb-2">
            <label class="mb-0">Topics</label>
            <TopicTag v-for="topic in topics" :topic="topic" disable @contextmenu.prevent="emit('remove', topic)" />
        </div>
        <div class="topic-input column">
            <input
                ref="input"
                type="text"
                spellcheck="false"
                placeholder="press enter to add . . ."
                v-model="text"
                @focus="inputFocused = true"
                @blur="inputFocused = false"
                @keyup.enter.prevent="addTopic"
            />
            <aside v-if="matchingResults.length > 0">
                <template v-for="topic in matchingResults.slice(0, 10)">
                    <div class="match px-3 py-2" tabindex="0"
                        @mousedown.prevent="useTopic(extractId(topic.id))"
                        @keyup.enter.prevent="useTopic(extractId(topic.id))"
                        
                    >
                        {{ extractId(topic.id) }}
                    </div>
                </template>
            </aside>
        </div>
    </main>
</template>

<style scoped lang="scss">
div.row {
    width: min-content;
    
    label {
        vertical-align: middle;
        line-height: 1.5rem;
    }
}

div.topic-input {
    position: relative;
}

aside {
    top: calc(2rem + 4px);
    width: stretch;
    position: absolute;
    background-color: $white-1;
    border-radius: 0 0 0.25rem 0.25rem;
    border: 2px solid $blue;
    border-top: 2px dashed $white-2;

    div:hover {
        background-color: $white-2;
    }
}

.field.invalid {
    aside {
        border-color: $red;
        border-top-color: $white-2;
    }
}

</style>