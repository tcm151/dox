<template>
    <div class="modal" v-bind:class="{ 'is-active': showModal }">
        <div class="modal-background"></div>
        <div class="modal-card">
            <div class="modal-card-head" v-if="modalTitle">
                <p class="modal-card-title">{{ modalTitle }}</p>
                <button class="delete" @click.prevent="$emit('toggleModal')"></button>
            </div>
            <div class="modal-card-body" v-if="modalContent">
                <p>{{ modalContent }}</p>
            </div>
            <div class="modal-card-foot" v-if="modalFooter">
                <p>{{ modalFooter }}</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

defineProps({
    showModal: Boolean,
    modalTitle: String,
    modalContent: String,
    modalFooter: String,
});

defineEmits([
    "toggleModal"
]);

</script>