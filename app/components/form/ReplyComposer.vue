<script setup lang="ts">
const props = withDefaults(defineProps<{
    modelValue: string
    submitting?: boolean
    rows?: number
    autofocus?: boolean
    submitLabel?: string
    submitIcon?: string
    disabled?: boolean
    warning?: string
}>(), {
    submitting: false,
    rows: 2,
    autofocus: false,
    submitLabel: "Submit",
    submitIcon: "fa-comment",
    disabled: false,
})

const emit = defineEmits<{
    (event: "update:modelValue", value: string): void
    (event: "submit"): void
    (event: "cancel"): void
}>()

const textarea = useTemplateRef<HTMLTextAreaElement>("reply-textarea")

onMounted(() => {
    if (props.autofocus) textarea.value?.focus({ preventScroll: true })
})

function submit() {
    if (props.submitting || props.disabled) return
    emit("submit")
}
</script>

<template>
    <div class="reply-composer field" @click.stop>
        <textarea
            ref="reply-textarea"
            :rows="rows"
            :value="modelValue"
            :disabled="submitting"
            @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
            @keydown.ctrl.enter.prevent="submit"
        />
        <p v-if="warning" class="warning mt-2" role="status">{{ warning }}</p>
        <div class="row g-1 pt-2">
            <button type="button" class="success small" :disabled="submitting || disabled" @click="submit">
                <i aria-hidden="true" class="fa-solid" :class="submitIcon"></i>
                <span>{{ submitLabel }}</span>
            </button>
            <button type="button" class="danger small" :disabled="submitting" @click="emit('cancel')">
                <i aria-hidden="true" class="fa-solid fa-cancel"></i>
                <span>Cancel</span>
            </button>
        </div>
    </div>
</template>