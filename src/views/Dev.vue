<script setup lang="ts">
import { ref } from 'vue';
import TextEditor from '../components/utilities/TextEditor.vue';
import NotificationList from '../components/profile/NotificationList.vue';
import { GetSession } from '../services/store.new';

const session = GetSession();

</script>

<template>
    <div class="dev box">
        <NotificationList :user="session.User!" />
    </div>
</template>

<style scoped lang="scss">
@import '../styles/global.scss';

.dev {
    margin: 1em;
    padding: 1em;
}
</style>