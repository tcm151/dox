<script setup lang="ts">
const props = defineProps<{
    visible: boolean
    media: FileList | null
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
    <Popup
        :visible="visible"
        title="Confirm Media"
        accept-label="Upload"
        decline-label="Cancel"
        @decline="emit('close')"
    >
        <div class="media column g-2" v-for="item in media">
            <section v-if="item.type.startsWith('image/')">
                <img :src="getMediaUrl(item)" alt="">
            </section>
            <section v-if="item.type.startsWith('audio/')">
                <audio controls :src="getMediaUrl(item)" />
            </section>
            <footer class="row center g-2">
                <span>{{ item.name }}</span>
                <span>{{ getFileSize(item.size) }}</span>
            </footer>
        </div>
    </Popup>
</template>

<style scoped lang="scss">
.form {
    width: 256px;
}

div.media {
    text-align: center;
    
    img {
        max-width: 256px;
        max-height: 256px;
        object-fit: contain;
        background-color: $white-1;
        border-radius: 0.25rem;
        padding: 0.5rem;
    }

    div.receipt {
        justify-content: space-around;
    }

    i.fa-cube {
        color: $yellow;
    }
}
</style>