<script setup lang="ts">
import { ref } from 'vue';

defineEmits(["search"])

const searchText = ref("");
const selected = ref(false);
const borderStyle = ref({});

function highlight() {
    borderStyle.value = {
        border: "1px white solid"
    }
}

function removeHighlight() {
    borderStyle.value = {
        border: "1px #393A49 solid"
    }
}

</script>


<template>
    <div class="searchbar is-hidden-mobile" :style="borderStyle">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input placeholder="Search..." @focus="highlight" @blur="removeHighlight">
    </div>
</template>

<style scoped lang="scss">
@import '../../styles/global.scss';

.searchbar {
    @include flex-h;
    align-items: center;

    border-radius: 0.25em;
    background-color: $dox-black-light;

    input {
        border: 0;
        outline: none;
        padding: 0.5em;
        border-radius: 0.25em;
        font-size: 18px;
        color: $dox-grey-dark;
        caret-color: $dox-grey;
        background-color: $dox-black-light;
    }

    input::placeholder {
        color: $dox-grey-dark;
    }

    input::selection {
        background-color: $dox-grey;
    }

    i {
        padding-left: 0.4em;
        font-size: 18px;
        color: $dox-grey-dark;
        background-color: $dox-black-light;
    }
}
</style>