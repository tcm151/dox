<script setup lang="ts">
import { ref } from 'vue';
import TextEditor from '../components/utilities/TextEditor.vue';

const text = ref("");

</script>

<template>
    <div class="dev box">
        <TextEditor :text="text" />
    </div>
</template>

<style scoped lang="scss">
@import '../styles/global.scss';

.dev {
    margin: 1em;
    padding: 1em;
}
</style>