<template>
    <div class="modal" v-bind:class="{ 'is-active': showModal }">
        <div class="modal-background"></div>
        <div class="modal-content">
            <div class="message is-danger is-medium">
                <div class="message-header" v-if="modalTitle">
                    <p class="">{{ modalTitle }}</p>
                    <button class="delete" @click.prevent="$emit('toggleModal')"></button>
                </div>
                <div class="message-body" v-if="modalContent">
                    <p>{{ modalContent }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

defineProps({
    showModal: Boolean,
    modalTitle: String,
    modalContent: String,
});

defineEmits([
    "toggleModal"
]);

</script>