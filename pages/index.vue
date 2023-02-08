<script setup lang="ts">
</script>

<template>
    <div class="grid g-5">
        <div class="box p-5" style="grid-area: center">

        </div>
        <div class="box p-5" style="grid-area: right">

        </div>
        <div class="box p-5" style="grid-area: bottom">

        </div>
    </div>
</template>

<style scoped lang="scss">
@import "~/assets/global.scss";

.grid {
    height: 100%;
    @include fill-width(800px);
    
    display: grid;
    grid: 2fr 1fr / 3fr 2fr;
    grid-template-areas: "center right"
                         "bottom right";
}

.box {
    border-radius: 0.5rem;
    background-color: $dox-white-ultra;
}
</style>