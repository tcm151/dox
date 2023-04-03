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
    <Popup :visible="showPopup" title="Popup" :accept="() => { }" :decline="() => { }">
        <span>This is the default!</span>
    </Popup>
    <div class="page">
        <div class="slot">
            <slot />
        </div>
        <footer class="m-5">
            <div class="row px-5">
                <div class="extras">
                    <NuxtLink to="/home">Home</NuxtLink>
                    <NuxtLink to="/about">About</NuxtLink>
                    <NuxtLink to="/contact">Contact</NuxtLink>
                </div>
                <img class="icon" src="~/assets/images/surrealdb-icon.png">
            </div>
        </footer>
    </div>
    <Hints />
</template>

<style lang="scss">
.page {
    @include flex-v;
    align-items: center;
    height: calc(100vh - 35px);
    overflow-y: auto;
    overflow-x: hidden;
    background-color: $dox-white-light;
}

.slot {
    width: 100%;
    flex: 1 1;
    @include flex-v;
    align-items: center;

    > div, > section {
        padding: 1rem;
    }
}
</style>


<style scoped lang="scss">
footer {
    width: 750px;

    a {
        font-weight: 700;
    }

    a:hover {
        color: #777;
    }

    .row {
        align-items: center;
        justify-content: space-between;
    }

    .extras {
        @include flex-v (0.25rem);
        font-weight: 600;
    }

    .icon {
        flex: 0 1;
        height: 2rem;
        object-fit: contain;
        filter: grayscale(100%);
    }
}
</style>