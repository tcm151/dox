<template>
    <Navbar />
    <div>
        <router-view>
        </router-view>
    </div>
    <Modal :show-modal="showModal" :modal-content="modalContent" @toggle-modal="toggleModal"/>
</template>

<script setup lang="ts">
import "./styles/global.scss"
import { provide, ref } from "vue";
import Modal from "./components/Modal.vue"
import Navbar from "./components/Navbar.vue"

const showModal = ref(false);
const modalContent = ref("This is the content of the modal!");

function toggleModal(content?: string) {
    if (content) modalContent.value = content;
    showModal.value = !showModal.value;
}

provide('toggleModal', toggleModal)

</script>
