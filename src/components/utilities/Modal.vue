<script setup lang="ts">

defineProps<{
    showModal: boolean,
    modalTitle: string,
    modalContent: string,
}>();

defineEmits(["toggleModal"]);

</script>

<template>
    <div class="modal" v-bind:class="{ 'is-active': showModal }">
        <div class="modal-background"></div>
        <div class="popup">
            <div class="header">
                <p class="modal-title">{{ modalTitle }}</p>
                <button class="delete" @click.prevent="$emit('toggleModal')"></button>
            </div>
            <div class="contents" v-if="modalContent">
                <p class="modal-content">{{ modalContent }}</p>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '../../styles/global.scss';

.popup {
    @include flex-v;
    z-index: 999;

    margin: 2em;
    max-width: 500px;
}

.header {
    @include flex-h;
    align-items: center;
    justify-content: space-between;


    padding: 0.5em 1em;
    background-color: $danger;
    border-radius: 0.25em 0.25em 0 0;

    .modal-title {
        color: $white;
        font-size: 2em;
        font-weight: 900;
    }
}

.contents {
    @include flex-v (1em);

    padding: 1em;
    background-color: $white;
    border-radius: 0 0 0.25em 0.25em;

    .modal-content {
        margin: 0;
        font-size: 1em;
        font-weight: 500;
    }
}
</style>