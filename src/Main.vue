<template>
    <header>
        <Header />
    </header>
    <router-view>

    </router-view>
</template>

<script setup lang="ts">
import "./styles/global.scss"
import Header from "./components/Header.vue"
</script>
