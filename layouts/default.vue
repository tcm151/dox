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
</script>

<template>
    <Navbar />
    <Login :visible="showLogin"/>
    <Popup :visible="showPopup" title="Popup" :accept="() => { }" :decline="() => { }">
        <span>This is the default!</span>
    </Popup>
    <main class="page">
        <slot class="slot" />
        <footer class="row px-5 m-5">
                <div class="links">
                    <NuxtLink to="/home">Home</NuxtLink>
                    <NuxtLink to="/about">About</NuxtLink>
                    <NuxtLink to="/contact">Contact</NuxtLink>
                </div>
                <img class="icon" src="/images/surrealdb-icon.png">
        </footer>
    </main>
    <Hints />
</template>

<style lang="scss">
main.page {
    @include flex-v;
    align-items: center;
    height: calc(100vh - 35px);
    overflow-y: auto;
    overflow-x: hidden;
    background-color: $dox-white-light;

    > article, > section, > div {
        flex: 1 1;
    }
}
</style>


<style scoped lang="scss">
footer.row {
    @include fit-width (800px, 1rem);
    justify-content: space-between;
    align-items: center;

    .links {
        @include flex-v (0.25rem);
        font-weight: 600;
        font-weight: 700;
    }

    .links:hover {
        color: #777;
    }

    .icon {
        flex: 0 1;
        height: 2rem;
        object-fit: contain;
        filter: grayscale(100%);
    }
}
</style>