<script setup lang="ts">

const settings = useSettings()

</script>


<template>
    <article class="column g-4 p-4">
        <section class="box form g-1 p-5">
            <div class="field row center py-2">
                <label class="f-1">enable animations</label>
                <Toggle v-model:enabled="settings.user.hoverAnimations" />
            </div>
            <div class="field row center py-2">
                <label class="f-1">enable notifications</label>
                <Toggle :enabled="false" />
            </div>
            <div class="field row center">
                <label class="f-1">hint duration (ms)</label>
                <input type="number" size="4" step="250" v-model="settings.user.hintDuration">
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(40rem, 1rem);
}

section.form {
    input {
        max-width: 8rem;
    }
}
</style>