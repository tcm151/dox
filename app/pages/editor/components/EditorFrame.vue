<script setup lang="ts">
defineProps<{
    title: string
    submitting?: boolean
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
    <article class="column p-4">
        <div class="container box column g-3 p-5">
            <section class="editor form column" v-show="!preview">
                <header class="row inline between g-4">
                    <h1>{{ title }}</h1>
                    <slot name="header-actions" />
                </header>
                <slot name="form" />
            </section>
            <section class="preview f-1" v-show="preview">
                <slot name="preview" />
                <span class="watermark">Preview</span>
            </section>
            <footer class="row wrap g-2 mt-3">
                <ButtonSpinner class="success f-2 b-0" :loading="submitting" @click="emit('submit')">
                    <i class="fa-solid fa-share"></i>
                    <span>Submit</span>
                </ButtonSpinner>
                <button class="info f-1 b-0" @click="togglePreview">
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
    @include fit-width (60rem, 1rem);
    flex: 1 1 auto;
    min-height: 0;
    box-sizing: border-box;
}

article > div.box,
section.editor,
section.form {
    flex: 1 1 auto;
    min-height: 0;
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
        font-weight: 900;
        opacity: 0.05;
        color: $purple;
        text-align: center;
        text-transform: uppercase;
        transform: translate(-50%, -50%);
    }
}
</style>