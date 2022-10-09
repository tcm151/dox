<script setup lang="ts">
import { ref } from 'vue';
import { marked } from 'marked';

const props = defineProps<{ text: string }>();
const emit = defineEmits(['textChanged'])

const showPreview = ref<boolean>(false);

function togglePreview() {
    showPreview.value = !showPreview.value;
}

function sanitized(text: string) {
    return marked.parse(text);
}
</script>

<template>
    <form id="texteditor">
        <div class="texteditor-toolbar">
            <!-- <div id="bold" class="tool">
                <i class="fa-solid fa-bold"></i>
            </div>
            <div class="tool">
                <i class="fa-solid fa-italic"></i>
            </div> -->
            <div class="tool" @click="togglePreview">
                <i class="fa-solid fa-eye"></i>
            </div>
            <div class="toolbar-end">
                <!-- <i class="fa-solid fa-cannabis"></i> -->
            </div>
        </div>
        <textarea class="textarea" rows="4" v-model="text" @keydown="$emit('textChanged', props.text)"
                  v-if="!showPreview"></textarea>
        <div class="preview content box mt-0 is-shadowless" v-html="sanitized(text)" v-if="showPreview">
        </div>
    </form>
</template>

<style scoped lang="scss">
@import '../../styles/global.scss';

.texteditor-toolbar {
    @include flex-h;
    border-radius: 0.5em 0.5em 0 0;

    :first-child {
        border-top-left-radius: 0.25em;
    }

    :last-child {
        border-top-right-radius: 0.25em;
    }

    .tool {
        width: 32px;
        height: 28px;

        @include flex-h;
        align-items: center;
        justify-content: center;

        padding: 0.5em;
        background-color: $light;
        // border: solid $grey-light 1px;
    }

    .tool:hover {
        color: $primary;
        background-color: $grey-lighter;
    }

    .toolbar-end {
        flex: 1 0 28px;
        @include flex-h;
        align-items: center;
        justify-content: right;

        padding: 0.33em;
        background-color: $light;
    }
}

.textarea,
.preview {
    border: 1px $dox-white solid;
    border-radius: 0 0 0.5em 0.5em;
}

.textarea:focus {
    box-shadow: none;
}

.content {
    blockquote {
        padding: 0.5em !important;
    }
}
</style>