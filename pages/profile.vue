<script setup lang="ts">
const session = getSession();

interface Response {
    success: boolean
    user: {
        id: string
        name: string
    }
}

async function authenticate() {
    const { data: response } = await useApi<Response>("/api/authenticate")

    console.log(response.value);
    console.log(response.value?.user);
}
</script>


<template>
    <ClientOnly>
        <div class="mt-5" v-if="session.isAuthenticated">
            <h1>Hi, {{ session.user?.name }}</h1>
            <div class="row mt-4">
                <button @click="authenticate">Authenticate</button>
            </div>
        </div>
        <div class="mt-5" v-else>
            <button>You are not logged in.</button>
        </div>
    </ClientOnly>
</template>