<template>
    <div class="modal" v-bind:class="{ 'is-active': showModal }">
        <div class="modal-background"></div>
        <div class="modal-content">
            <div class="card">
                <div class="card-content">
                    <p>{{ modalContent }}</p>
                </div>
            </div>
        </div>
        <button class="modal-close is-large" @click.prevent="$emit('toggleModal')"></button>
    </div>
</template>

<script setup lang="ts">
// import { ref } from "vue";

defineProps({
    showModal: Boolean,
    modalContent: String,
});

defineEmits([
    "toggleModal"
]);

// const showModal = ref(false);
// const modalContent = ref("This is where the content goes!");

// function toggleModal(content: string, truth?: boolean) {
//     showModal.value = (truth) ? truth : !showModal.value;
// }

</script>