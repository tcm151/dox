<script setup lang="ts">
definePageMeta({
    middleware: async (to, from) => {
        const session = getSession()
        if (session.isAuthenticated) {
            return navigateTo(`/user/${extractId(session.user.id)}`)
        }
    }
})

const session = getSession();

async function authenticate() {
    await session.useApi(`/api/profile/authenticate`)
}

async function verifyAccount() {
    await useFetch("/api/user/verify")
}
</script>


<template>
    <ClientOnly>
        <article class="profile-page column g-2 p-4">
            <section class="buttons row g-2">
                <button @click="verifyAccount">Verify</button>
                <button @click="authenticate">Authenticate</button>
            </section>
        </article>
    </ClientOnly>
</template>

<style scoped lang="scss">
.profile-page {
    @include fit-width (800px, 1rem);
}

section.buttons {
    > * {
        flex: 1 1;
    }
}
</style>