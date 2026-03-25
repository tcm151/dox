<script setup>
defineProps(['error'])

const router = useRouter()

let complain = ref(false)
</script>

<template>
    <article class="error fit-small">
        <section class="details box column inline p-6">
            <div class="column g-2 mb-5">
                <h1>ERR: {{ error.statusCode }}</h1>
                <p>{{ error.message }}</p>
                <p v-if="error.data?.message">{{ error.data.message }}</p>
            </div>
            <div class="row g-2">
                <button class="success" @click="() => { clearError(); router.back(); }">
                    <i class="fa-solid fa-hand-point-left"></i>
                    <span>Go Back</span>
                </button>
                <button class="danger" @click="complain = true">
                    <i class="fa-solid fa-keyboard"></i>
                    <span>Complain</span>
                </button>
            </div>
        </section>
        <Window title="Submit Feedback" icon="fa-solid fa-keyboard" width="40rem" :visible="true" @close="complain = false" v-if="complain">
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
    background-color: $white-1;

    
    section.details {
        
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