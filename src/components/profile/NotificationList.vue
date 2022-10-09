<script setup lang="ts">
import axios from 'axios';
import { marked } from 'marked';
import { onBeforeMount, ref } from 'vue';
import { User, Notification } from '../../api/types';
import { timeSince } from '../../services/dateTime';
import { sortNew } from '../../services/sorting'
import { GetSession } from '../../services/store.new';
import Tag from '../utilities/Tag.vue';

const props = defineProps<{ user: User }>();

const notifications = ref<Notification[]>([])

function sanitized(text: string) {
    return marked.parse(text);
}

onBeforeMount(async () => {
    const response = await axios.get(`http://localhost:8080/users/${props.user?.user_id}/notifications`)
    notifications.value = response.data;
    notifications.value.sort(sortNew)

    GetSession().set("unreadNotifications", notifications.value.length)
})
</script>

<template>
    <div class="notification box mb-2 p-4" v-for="notification in notifications" :key="notification.time">
        <div class="content content-dark mb-2" v-html="sanitized(notification.subject)" />
        <div class="pills">
            <p class="tag is-light is-info">{{ timeSince(notification.time) }}</p>
            <p class="tag is-light is-link">Context</p>
            <p class="tag is-light is-danger">Dismiss</p>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '../../styles/global.scss';

.notification {
    padding: 1em;
    font-weight: 500;
    border-radius: 0.5em;
    color: $dox-white;
    background-color: $dox-black-light;

    blockquote {
        font-weight: 600;
        color: $dox-black-light;
        background-color: $dox-white-dark;
    }
}

.pills {
    @include flex-h (0.5em);

    .tag {
        font-weight: 600;
    }
}
</style>