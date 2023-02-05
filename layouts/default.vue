<script setup lang="ts">
let events = useEvents();

let showPopup = ref(false);
let showLogin = ref(false);

events.subscribe("togglePopup", () => showPopup.value = !showPopup.value)
events.subscribe("toggleLogin", () => showLogin.value = !showLogin.value)
</script>

<template>
    <Navbar />
    <Login :visible="showLogin"/>
    
    <Hints />
    
    <Popup :visible="showPopup" title="Popup" :accept="() => { }" :decline="() => { }">
        <span>This is the default!</span>
    </Popup>
    
    <div class="page">
        <div class="slot m-5">
            <slot />
        </div>
        <footer class="m-5">
            <div class="row px-5">
                <div class="extras">
                    <NuxtLink to="/">Home</NuxtLink>
                    <NuxtLink to="/about">About</NuxtLink>
                    <NuxtLink to="/contact">Contact</NuxtLink>
                </div>
                <img class="icon" src="~/assets/surrealdb-icon.png">
            </div>
        </footer>
    </div>
</template>

<style lang="scss">
@import "~/assets/global.scss";

.page {
    @include flex-v;
    align-items: center;
    height: calc(100% - 35px);
    
    overflow-y: auto;
    overflow-x: hidden;

    background-color: $dox-white-light;
}

.slot {
    @include fill-width(750px);
    flex: 1 1 auto;
    @include flex-v;
    align-items: center;
}
</style>


<style scoped lang="scss">
@import "~/assets/global.scss";

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

    .powered {
        flex: 0 1;
        width: 15rem;
        object-fit: contain;
        filter: grayscale(100%);
    }
}
</style>