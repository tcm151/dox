<script setup lang="ts">
import type { User } from '~/types';

const { data: users } = useAsyncData('users', () => {
    return $fetch<User[]>("/api/user")
})
</script>
    
<template>
    <article class="p-4">
        <section class="box column g-2 p-3">
            <div class="row g-2" v-for="user in users">
                <Votes :target="user" />
                <UserTag :fill="1" :user="user" />
                <TimeTag :time="user.dateCreated" />
                <Tag type="danger" icon="fa-trash" />
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>