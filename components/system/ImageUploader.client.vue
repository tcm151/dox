<script setup lang="ts">
const props = defineProps<{
    visible: boolean
    images: FileList | null
}>()

watch(() => props.visible, async () => {
    if (props.visible) {
        await session.fetchProfile()
    }
})

const emit = defineEmits<{
    (event: 'close'): void
}>()

const session = getSession()

function getImageThumbnail(image: File) {
    return URL.createObjectURL(image)
}

</script>

<template>
    <Popup
        :visible="visible"
        title="Confirm Image"
        accept-label="Upload"
        decline-label="Cancel"
        @decline="emit('close')"
    >
        <div class="image column g-2 mt-2" v-for="image in images">
            <img :src="getImageThumbnail(image)" alt="">
            <div class="receipt row">
                <h4 class="row center-inline g-1">
                    <span>Cost: ~{{ calculateTokens(image) }}</span>
                    <i class="fa-solid fa-cube"></i>
                </h4>
                <h4 class="row center-inline g-1">
                    <span>Available: {{ session.user.tokens }}</span>
                    <i class="fa-solid fa-cube"></i>
                </h4>
            </div>
        </div>
    </Popup>
</template>

<style scoped lang="scss">
.form {
    width: 256px;
}

div.image {
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