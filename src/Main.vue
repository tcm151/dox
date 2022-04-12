<template>
    <div class="has-background-light">
        <Navbar />
        <div class="container">
            <router-view></router-view>
        </div>
        <Modal :show-modal="showModal" :modal-title="modalTitle" :modal-content="modalContent"
            :modal-footer="modalFooter" @toggle-modal="toggleModal" />
    </div>
</template>

<script setup lang="ts">
import "./styles/global.css"
import { provide, ref } from "vue";
import Modal from "./components/Modal.vue"
import Navbar from "./components/Navbar.vue"

const showModal = ref(false);
const modalTitle = ref("");
const modalContent = ref("");
const modalFooter = ref("");

function toggleModal(title: string, content?: string, footer?: string) {
    if (title) modalTitle.value = title;
    if (content) modalContent.value = content;
    if (footer) modalFooter.value = footer;
    showModal.value = !showModal.value;
}

provide('toggleModal', toggleModal)

</script>
