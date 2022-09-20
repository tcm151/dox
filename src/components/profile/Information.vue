<script setup lang="ts">
import { computed } from 'vue';
import { User } from '../../api/types';
import { store } from '../../services/store';

defineProps<{ user: User }>()

const session = computed(() => {
    return store.state.session;
})

</script>

<template>
    <div class="profile-header box my-2">
        <figure class="profile-picture image is-96x96">
            <img src="https://bulma.io/images/placeholders/96x96.png">
        </figure>
        <div class="info" v-if="session.authenticated">
            <p class="username">{{ user?.username }}</p>
            <p>{{ user?.email }}</p>
        </div>
        <div class="info" v-else>
            <p class="username">{{ user?.username }}</p>
            <div class="login-required has-background-danger">Login to view additional information</div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '../../styles/global.scss';

.profile-header {
    @include flex-h;
    gap: 1em;

    margin: 0;
}

.info {
    @include flex-v;

    .username {
        font-size: xx-large;
        font-weight: 600;
    }
}
</style>