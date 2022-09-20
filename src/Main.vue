<script setup lang="ts">
import "./styles/global.css"
import { provide, ref } from "vue";
import Modal from "./components/utilities//Modal.vue"
import Navbar from "./components/nav//Navbar.vue"

const showModal = ref(false);
const modalTitle = ref("");
const modalContent = ref("");

function toggleModal(title: string, content?: string, footer?: string) {
    if (title) modalTitle.value = title;
    if (content) modalContent.value = content;
    showModal.value = !showModal.value;
}

provide('toggleModal', toggleModal)

</script>

<template>
    <div class="main">
        <Navbar />
        <div class="router-container">
            <router-view></router-view>
        </div>
    </div>
    <Modal :show-modal="showModal" :modal-title="modalTitle" :modal-content="modalContent"
        @toggle-modal="toggleModal" />
</template>

<style lang="scss">
@import './styles/global.scss';

html {
    overflow-y: auto;
}

.router-container {
    @include flex-h;
    justify-content: center;

    >* {
        flex: 1 1 auto;
        max-width: 1000px;
    }
}
</style>