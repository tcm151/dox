<script setup lang="ts">
let events = useEvents();

let showPopup = ref(false);
let showLogin = ref(false);

events.subscribe(Trigger.togglePopup, () => showPopup.value = !showPopup.value)
events.subscribe(Trigger.toggleLogin, () => showLogin.value = !showLogin.value)

onMounted(() => {
    events.publish(Trigger.clientStarted);
})
</script>

<template>
    <Navbar />
    <Login :visible="showLogin"/>
    <Popup :visible="showPopup" title="Popup" :accept="() => { }" :decline="() => { }">
        <span>This is the default!</span>
    </Popup>
    <main class="page column center-inline">
        <slot />
    </main>
    <Hints />
</template>

<style scoped lang="scss">
main.page {
    height: calc(100% - 35px);
    background-color: $dox-white-light;
    // overflow: hidden;
}
</style>