<script setup lang="ts">
import type { Topic } from '@@/shared/types';

const hints = useHints()
const settings = useSettings()

const props = defineProps<{
    topics: {
        text: string
        items: string[]
        add: (topic: string) => void
        remove: (topic: string) => void
    }
}>()

const valid = useValidation()
function validTopic() {
    return (props.topics.text && props.topics.text !== '') ? valid.topic.name(props.topics.text) : true
}

const { data: available } = await useDatasource<Topic[]>("/api/topic/available")

const inputFocused = ref<boolean>(false)
const matchingResults = computed(() => {
    if (props.topics.text && props.topics.text.length > 0) {
        return available.value!.filter(t => extractId(t.id)?.toLowerCase().includes(props.topics.text.toLowerCase()))
    }
    else {
        return []
    }
})

function addTopic() {
    if (props.topics.items.length >= settings.app.topics.perSubmission) {
        hints.addError(`You can only add ${settings.app.topics.perSubmission} topics per submission.`)
        props.topics.text = ""
        return
    }
    if (settings.app.topics.restrict && !settings.app.topics.allowed.includes(`topic:${props.topics.text}`)) {
        hints.addError("You must use one of the predefined topics.")
        return
    }
    if (props.topics.items.includes(`topic:${props.topics.text}`)) {
        hints.addError("You have already added this topic.")
        return
    }
    if (props.topics.text && validTopic()) {
        props.topics.add(props.topics.text)
    }
    else {
        hints.addError("That is an invalid topic.")
    }
}

function useTopic(topic: string | undefined) {
    if (topic) {
        props.topics.text = topic
        addTopic()
    }
}

// REFACTOR extract shared searchable dropdown component used by topic and mention pickers.
</script>

<template>
    <main class="field" :class="{ 'invalid': !validTopic() }">
        <div class="row inline g-2 mb-2">
            <label class="mb-0">Topics</label>
            <TopicTag v-for="topic in topics.items" :topic="topic" disable @click="topics.remove(topic)" />
        </div>
        <div class="topic-input column">
            <input
                ref="input"
                type="text"
                spellcheck="false"
                placeholder="press enter to add . . ."
                v-model="topics.text"
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
    top: 2rem;
    width: stretch;
    position: absolute;
    background-color: $white-1;
    border-radius: 0 0 0.25rem 0.25rem;
    border: 2px solid $blue;
    border-top: 2px dashed $white-2;

    .match {
        font-size: 0.8rem;
        font-weight: 500;
    }
    
    .match:hover {
        cursor: pointer;
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