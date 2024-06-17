<script setup lang="ts">
import type { User } from '~/types';

const { data: users } = useAsyncData('users', () => {
    return $fetch<User[]>("/api/user")
})
</script>
    
<template>
    <article class="p-4">
        <section class="box column g-2 p-3">
            <div class="row g-1" v-for="user in users">
                <Votes :target="user" />
                <Tag v-if="hasRole(user, 'admin')" type="link" icon="fa-shield" />
                <Tag v-if="hasRole(user, 'developer')" type="link" icon="fa-code" />
                <UserTag class="f-1" :user="user" />
                <TimeTag width="4rem" :time="user.dateJoined" />
                <Tag type="info" icon="fa-ellipsis" />
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>