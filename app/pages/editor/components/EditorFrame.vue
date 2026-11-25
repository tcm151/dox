<script setup lang="ts">
defineProps<{
    title: string
    submitting?: boolean
    unavailable?: boolean
}>()

const preview = ref<boolean>(false)

const emit = defineEmits<{
    (event: 'submit'): void
}>()

function togglePreview() {
    preview.value = !preview.value
}
</script>

<template>
    <article class="content-width column p-4">
        <div class="box column g-3 p-5">
            <div class="editor-stage">
                <Transition name="editor-mode">
                    <section class="editor form" v-show="!preview" :inert="preview" :aria-hidden="preview">
                        <header class="row between">
                            <h1>{{ title }}</h1>
                            <div class="row inline g-4">
                                <slot name="header-actions" />
                            </div>
                        </header>
                        <aside v-if="unavailable" class="unavailable br-small row inline g-2 p-3">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <span>Publishing is not available yet. This editor is preview-only.</span>
                        </aside>
                        <slot name="form" />
                    </section>
                </Transition>
                <Transition name="editor-mode">
                    <section v-if="$slots.preview" class="preview f-1" v-show="preview" :inert="!preview" :aria-hidden="!preview">
                        <slot name="preview" />
                        <span class="watermark">Preview</span>
                    </section>
                </Transition>
            </div>
            <footer v-adaptive:md class="row wrap g-2 mt-3">
                <ButtonSpinner class="success active f-2 b-0" :loading="submitting" :disabled="unavailable" @click="emit('submit')">
                    <i class="fa-solid fa-share"></i>
                    <span>Submit</span>
                </ButtonSpinner>
                <button v-if="$slots.preview" class="info f-1 b-0" @click="togglePreview">
                    <i v-if="!preview" class="fa-solid fa-eye"></i>
                    <i v-else class="fa-solid fa-eye-slash"></i>
                    <span>Preview</span>
                </button>
                <slot name="footer-actions" />
            </footer>
        </div>
        <slot />
    </article>
</template>

<style scoped lang="scss">
article {
    width: 100%;
    flex: 1 1 auto;
    min-height: 0;
    box-sizing: border-box;
}

article > div.box,
section.editor,
section.form {
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
}

div.editor-stage {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;

    > section {
        grid-area: 1 / 1;
    }
}

.editor-mode-enter-active,
.editor-mode-leave-active {
    transition: opacity var(--motion-duration-standard) var(--motion-easing-standard);
}

.editor-mode-enter-from,
.editor-mode-leave-to {
    opacity: 0;
}

section.editor > header,
footer.row {
    flex: 0 0 auto;
}

section.preview {
    position: relative;
    min-height: 0;
    white-space: normal;
    overflow-y: auto;

    div.content {
        white-space: normal;

        h1, h2, h3, h4 {
            margin-bottom: 0.2rem !important;
        }
    }

    .watermark {
        top: 50%;
        left: 50%;
        position: absolute;
        font-size: 5rem;
        font-weight: var(--fw-heavy);
        opacity: 0.05;
        color: $purple;
        text-align: center;
        text-transform: uppercase;
        transform: translate(-50%, -50%);
    }
}

</style>