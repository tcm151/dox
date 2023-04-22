<script setup lang="ts">
const items = ref([
    { type: 'folder', name: 'media', parent: '' },
    { type: 'folder', name: 'photos', parent: 'media' },
    { type: 'folder', name: 'videos', parent: 'media' },
    { type: 'folder', name: 'music', parent: 'media' },
    { type: 'folder', name: 'groceries', parent: '' },
    { type: 'folder', name: 'code', parent: '' },
    { type: 'file', name: 'spike.png', parent: 'photos' },
    { type: 'file', name: 'yennefer.png', parent: 'photos' },
    { type: 'file', name: 'zoe.png', parent: 'photos' },
    { type: 'file', name: 'zoe\'s birthday.mp4', parent: 'videos' },
    { type: 'file', name: 'spike and yennefer playing.mp4', parent: 'videos' },
    { type: 'file', name: 'lost.flac', parent: 'music' },
    { type: 'file', name: 'woods.flac', parent: 'music' },
    { type: 'file', name: 'fs.ts', parent: 'code' },
    { type: 'file', name: 'query.ts', parent: 'code' },
    { type: 'file', name: 'utils.ts', parent: 'code' },
])
</script>

<template>
    <article class="m-4 p-4">
        <Directory root="files" :buttons="['add-file', 'add-folder']" :items="items" />
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(400px, 1rem);
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;
}
</style>