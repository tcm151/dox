<script setup>
defineProps(['error'])

let complain = ref(false)
</script>

<template>
    <article class="error">
        <section class="details column center-inline py-5 px-6 ">
            <div class="column g-2 mb-5">
                <h1>ERR: {{ error.statusCode }}</h1>
                <p>{{ error.message }}</p>
                <p v-if="error.data?.message">{{ error.data.message }}</p>
            </div>
            <div class="row g-2">
                <button class="success" @click="clearError({ redirect: '/feed' })">Return to Safety</button>
                <button class="danger" @click="complain = true">Complain</button>
            </div>
        </section>
        <Window title="Submit Feedback" icon="fa-solid fa-keyboard" :visible="true" @close="complain = false" v-if="complain">
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
    background-color: $dox-white-1;

    
    section.details {
        @include fit-width(30rem, 1rem);
        border-radius: 0.25rem;
        background-color: $dox-white-0;
        
        div {
            text-align: center;

            h1 {
                font-size: 2.5rem;
                line-height: 2.5rem;
            }
        }
    }
}
</style>