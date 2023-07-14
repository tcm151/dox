<script setup lang="ts">
import { Trigger } from '~/services/events';

let events = useEvents();

let showPopup = ref(false);
let showLogin = ref(false);

useNuxtApp().hook("page:finish", () => {
    events.publish(Trigger.pageFinishedLoading)
})

events.subscribe(Trigger.togglePopup, () => showPopup.value = !showPopup.value)
events.subscribe(Trigger.toggleLogin, () => showLogin.value = !showLogin.value)

onMounted(() => {
    events.publish(Trigger.clientStarted);
})

if (process.client) {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`)

    window.addEventListener('resize', () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`)
    })
}
</script>

<template>
    <Navbar />
    <Login :visible="showLogin"/>
        <Popup :visible="showPopup" title="Popup" :accept="() => { }" :decline="() => { }">
            <span>This is the default!</span>
        </Popup>
    <NuxtLayout>
        <NuxtLoadingIndicator />
        <NuxtPage />
    </NuxtLayout>
    <Hints />
</template>

<style lang="scss">
main.page {
    height: calc(100vh - 40px);
    height: calc(calc(var(--vh, 1vh) * 100) - 40px);
    background-color: $dox-white-light;
    overflow-x: hidden;
    overflow-y: auto;

    > article, > section, > div {
        flex: 1 1;
    }
}

.swap-enter-active,
.swap-leave-active {
  transition: all 128ms ease-out;
}

.swap-leave-to,
.swap-enter-from {
    opacity: 0;
    filter: blur(0.25rem);
}
</style>