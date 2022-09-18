<script setup lang="ts">

defineProps({
    showModal: Boolean,
    modalTitle: String,
    modalContent: String,
});

defineEmits(["toggleModal"]);

</script>

<template>
    <div class="modal" v-bind:class="{ 'is-active': showModal }">
        <div class="modal-background"></div>
        <div class="modal-content">
            <div class="message is-danger is-medium">
                <div class="message-header" v-if="modalTitle">
                    <p class="is-size-3">{{ modalTitle }}</p>
                    <button class="delete" @click.prevent="$emit('toggleModal')"></button>
                </div>
                <div class="message-body p-5" v-if="modalContent">
                    <p class="is-size-5">{{ modalContent }}</p>
                </div>
            </div>
        </div>
    </div>
</template>