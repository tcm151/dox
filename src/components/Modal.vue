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

defineProps({
    showModal: Boolean,
    modalContent: String,
});

defineEmits([
    "toggleModal"
]);

</script>