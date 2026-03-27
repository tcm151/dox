<script setup lang="ts">
interface MediaFile extends File {
    description: string
}

// interface FilePackage extends FileList {
//     [Symbol.iterator](): IterableIterator<MediaFile>;
// }

const props = defineProps<{
    media: FileList | null
    loading?: boolean
}>()

const emit = defineEmits<{
    (event: 'close'): void
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
    <Popup title="Confirm Media" :loading="loading" :accept="{ label: 'Upload', action: () => {} }" :decline="{ label: 'Cancel', action: () => emit('close') }">
        <div class="media column g-2" v-for="item in (media as FileList)">
            <section v-if="item.type.startsWith('image/')">
                <img :src="getMediaUrl(item)" alt="">
            </section>
            <section v-if="item.type.startsWith('audio/')">
                <audio controls :src="getMediaUrl(item)" />
            </section>
            <footer class="form">
                <div class="field">
                    <label>File - {{ getFileSize(item.size) }}</label>
                    <input type="text" v-model="item.name">
                </div>
                <div class="field">
                    <label>Description</label>
                    <textarea resize="none" rows="5" v-model="(item as MediaFile).description" />
                </div>
            </footer>
        </div>
    </Popup>
</template>

<style scoped lang="scss">
div.field {
    textarea {
        resize: none;
    }
}
</style>