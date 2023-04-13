<script setup lang="ts">

let base64 = ref<string>("")

async function readFiles(event: Event) {
    const fileReader = new FileReader()
    const files = (event.target as HTMLInputElement).files
    fileReader.readAsDataURL(files![0])
    
    fileReader.onloadend = () => {
        base64.value = fileReader.result as string
    }
}
</script>

<template>
    <input type="file" @change="readFiles" />
    <img :src="base64">
</template>

<style scoped lang="scss">
img {
    height: 256px;
}
</style>