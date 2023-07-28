<script setup lang="ts">

const settings = useUserSettings()

</script>


<template>
    <article class="column g-4 p-4">
        <section class="form box p-5">
            <div class="row-fit g-2">
                <input type="checkbox" v-model="settings.state.hoverAnimations">
                <label>enable animations</label>
            </div>
            <div class="field row-fit">
                <label>hint duration (ms)</label>
                <input type="number" size="4" step="250" v-model="settings.state.hintDuration">
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(600px, 1rem);
}
</style>