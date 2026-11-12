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

const selectedIndex = ref(0)
const selectedItem = computed(() => props.media[selectedIndex.value])
const mediaUrls = new Map<File, string>()

function moveSelection(direction: -1 | 1) {
    selectedIndex.value = (selectedIndex.value + direction + props.media.length) % props.media.length
}

function getFileSize(bytes: number) {
    if (bytes >= 1_048_576) {
        return `${(bytes / 1_048_576).toFixed(1)} MB`
    }
    if (bytes >= 1_024) {
        return `${(bytes / 1_024).toFixed(1)} KB`
    }
}

function getMediaUrl(image: File) {
    let url = mediaUrls.get(image)
    if (!url) {
        url = URL.createObjectURL(image)
        mediaUrls.set(image, url)
    }
    return url
}

onBeforeUnmount(() => mediaUrls.forEach(url => URL.revokeObjectURL(url)))

</script>

<template>
    <Window title="Media Uploader" width="min(92vw, 96rem)" @close="emit('close')">
        <div v-if="selectedItem" class="media row g-4" :class="{ 'has-image': selectedItem.type.startsWith('image/') }">
                <section v-if="selectedItem.type.startsWith('image/')" class="preview">
                    <figure class="image br-small border-subtle">
                        <img :src="getMediaUrl(selectedItem)" :alt="selectedItem.name">
                    </figure>
                </section>
                <section v-if="selectedItem.type.startsWith('audio/')">
                    <audio controls :src="getMediaUrl(selectedItem)" />
                </section>
                <section class="form">
                    <div class="field">
                        <label>File - {{ getFileSize(selectedItem.size) }}</label>
                        <input type="text" v-model="selectedItem.name">
                    </div>
                    <MarkdownEditor class="f-1" label="Description" :rows="4" v-model="(selectedItem as MediaFile).description" />
                </section>
        </div>
        <footer class="row inline g-2 mt-4">
            <button class="link" :disabled="media.length < 2" @click="moveSelection(-1)">
                <i class="fa-solid fa-caret-left"></i>
            </button>
            <button class="link f-1" :disabled="loading" @click="emit('upload')">
                <span>Upload <span v-if="media.length > 1">{{ media.length }} files</span></span>
            </button>
            <button class="link" :disabled="media.length < 2" @click="moveSelection(1)">
                <i class="fa-solid fa-caret-right"></i>
            </button>
        </footer>
    </Window>
</template>

<style scoped lang="scss">
div.media {
    align-items: flex-start;

    .preview {
        flex: 1 1 0;
        min-width: 0;
    }

    .form {
        flex: 1 1 0;
        min-width: 0;
    }

    &.has-image {
        .form {
            flex: 0 1 clamp(16rem, 25vw, 24rem);
            align-self: flex-start;
        }
    }

    @media (max-aspect-ratio: 1/1) {
        @include flex-v;

        .preview,
        .form {
            flex: 0 1 auto;
            width: 100%;
        }
    }
}

figure.image {
    width: 100%;
    aspect-ratio: 4 / 3;
    max-height: min(75vh, 48rem);
    overflow: hidden;
    background-color: $white-1;

    img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
}

div.field {
    textarea {
        resize: none;
        min-height: 10rem;
        max-height: 25vh;
    }
}
</style>