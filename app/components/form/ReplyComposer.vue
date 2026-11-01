<script setup lang="ts">
const props = withDefaults(defineProps<{
    modelValue: string
    submitting?: boolean
    rows?: number
    autofocus?: boolean
    submitLabel?: string
    submitIcon?: string
}>(), {
    submitting: false,
    rows: 2,
    autofocus: false,
    submitLabel: "Submit",
    submitIcon: "fa-comment",
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
</script>

<template>
    <div class="reply-composer field" @click.stop>
        <textarea
            ref="reply-textarea"
            :rows="rows"
            :value="modelValue"
            :disabled="submitting"
            @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
            @keydown.ctrl.enter.prevent="emit('submit')"
        />
        <div class="row g-1 pt-2">
            <Tag class="success small" :loading="submitting" @click="emit('submit')">
                <i class="fa-solid" :class="submitIcon"></i>
                <span>{{ submitLabel }}</span>
            </Tag>
            <Tag class="danger small" :disabled="submitting" @click="emit('cancel')">
                <i class="fa-solid fa-cancel"></i>
                <span>Cancel</span>
            </Tag>
        </div>
    </div>
</template>