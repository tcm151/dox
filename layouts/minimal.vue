<script setup lang="ts">
let events = useEvents();

let showPopup = ref(false);
let showLogin = ref(false);

events.subscribe("togglePopup", () => showPopup.value = !showPopup.value)
events.subscribe("toggleLogin", () => showLogin.value = !showLogin.value)

onMounted(() => {
    events.publish("clientStarted");
})
</script>

<template>
    <Navbar />
    <Login :visible="showLogin"/>
    <Hints />
    <Popup :visible="showPopup" title="Popup" :accept="() => { }" :decline="() => { }">
        <span>This is the default!</span>
    </Popup>
    <section class="page">
        <div class="slot">
            <slot />
        </div>
    </section>
</template>

<style scoped lang="scss">
.page {
    @include flex-v;
    align-items: center;
    height: calc(100% - 35px);
    
    overflow-y: auto;
    overflow-x: hidden;

    background-color: $dox-white-light;
}

.slot {
    width: 100%;
    flex: 1 1 auto;
    @include flex-v;
    align-items: center;

    > div {
        padding: 0.5rem 1.5rem;
    }
}
</style>