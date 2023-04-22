<script setup>
defineProps(['error'])

let complain = ref(false)
</script>

<template>
    <article class="error">
        <section class="details column center-inline py-5 px-6 ">
            <div class="mb-5">
                <h1>ERR: {{ error.statusCode }}</h1>
                <p>{{ error.message }}</p>
            </div>
            <div class="row g-2">
                <button class="success" @click="clearError({ redirect: '/feed' })">Return to Safety</button>
                <button class="danger" @click="complain = true">Complain</button>
            </div>
        </section>
        <Window title="Submit Feedback" :visible="true" @close="complain = false" v-if="complain">
            <section class="p-2">
                <Feedback placeholder="Tell us what happened..." @submit="clearError({ redirect: '/feed' })" />
            </section>
        </Window>
    </article>
</template>

<style scoped lang="scss">
article.error {
    height: 100%;
    display: grid;
    place-items: center;
    background-color: $dox-white-light;

    
    section.details {
        border-radius: 0.25rem;
        background-color: $dox-white-ultra;
        
        div {
            text-align: center;

            h1 {
                font-size: 2.5rem
            }
        }
    }
}
</style>