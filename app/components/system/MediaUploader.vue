<script setup lang="ts">

interface MediaFile extends File {
    description: string
}

const props = defineProps<{
    media: FileList | null
    loading?: boolean
}>()

const emit = defineEmits<{
    (event: "upload"): void
    (event: "close"): void
}>()

function getFileSize(bytes: number) {
    if (bytes >= 1_048_576) {
        return `${(bytes / 1_048_576).toFixed(1)} MB`
    }
    if (bytes >= 1_024) {
        return `${(bytes / 1_024).toFixed(1)} KB`
    }
}

function getMediaUrl(image: File) {
    return URL.createObjectURL(image)
}

</script>

<template>
    <Popup title="Upload Media" width="60rem" :loading="loading" :accept="{ label: 'Confirm', action: () => emit('upload') }" :decline="{ label: 'Cancel', action: () => emit('close') }">
        <div class="media row g-4" v-for="item in media">
            <section v-if="item.type.startsWith('image/')" class="f-1 b-0">
                <img :src="getMediaUrl(item)" alt="">
            </section>
            <section v-if="item.type.startsWith('audio/')">
                <audio controls :src="getMediaUrl(item)" />
            </section>
            <section class="form f-1 b-0">
                <div class="field">
                    <label>File - {{ getFileSize(item.size) }}</label>
                    <input type="text" v-model="item.name">
                </div>
                <div class="field f-1">
                    <label>Description</label>
                    <textarea class="f-1" resize="none" v-model="(item as MediaFile).description" />
                </div>
            </section>
        </div>
    </Popup>
</template>

<style scoped lang="scss">
img {
    width: stretch;
    border-radius: 0.25rem;
}

div.field {
    textarea {
        resize: none;
    }
}
</style>