<template>
    <Header />
    <div>
        <router-view>
        </router-view>
    </div>
</template>

<script setup lang="ts">
import "./styles/global.scss"
import Header from "./components/Header.vue"
</script>
