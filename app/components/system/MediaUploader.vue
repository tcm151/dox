<script setup lang="ts">

interface MediaFile extends File {
    description: string
}

const props = defineProps<{
    media: FileList
    loading?: boolean
}>()

const emit = defineEmits<{
    (event: "upload"): void
    (event: "close"): void
}>()

const selectedItem = ref<File>(props.media[0]!)

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
    <Window title="Media Uploader" width="85%" @close="emit('close')">
        <template v-for="item in media">
            <div v-if="selectedItem == item" class="media row g-4">
                <section v-if="item.type.startsWith('image/')" class="f-1 b-0">
                    <figure class="image">
                        <img :src="getMediaUrl(item)" alt="">
                    </figure>
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
            <footer class="row g-2 mt-4">
                <button class="link">
                    <i class="fa-solid fa-caret-left"></i>
                </button>
                <button class="link f-1" :disabled="loading" @click="emit('upload')">
                    Upload
                </button>
                <button class="link">
                    <i class="fa-solid fa-caret-right"></i>
                </button>
            </footer>
        </template>
    </Window>
</template>

<style scoped lang="scss">
div.media {
    @media (max-aspect-ratio: 1/1) {
        @include flex-v;
    }
}

figure {
    border-radius: 0.25rem;
    border: 1px solid $white-2;
    
    img {
        max-height: 60vh;
        object-fit: contain;
    }
}

div.field {
    textarea {
        resize: none;
    }
}
</style>