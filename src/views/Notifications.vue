<script setup lang="ts">
import NotificationList from '../components/profile/NotificationList.vue';
import { GetSession } from '../services/store.new';

const session = GetSession();

</script>


<template>
    <div class="notifications">
        <!-- <div class="tabs is-centered is-fullwidth mb-2">
            <ul>
                <li class="is-active">
                    <a>Unread</a>
                </li>
                <li>
                    <a>Follows</a>
                </li>
                <li>
                    <a>Replies</a>
                </li>
            </ul>
        </div> -->
        <div class="px-2 mt-2">
            <NotificationList :user="session.User!" />
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '../styles/global.scss';

.tabs {
    background-color: $dox-black;

    a {
        color: $dox-white;
        font-weight: 900;
        padding: 0.25 0.5em;
        border-bottom-width: 0.2em;
    }

    a:hover {
        color: $dox-black-light;
        border-color: $dox-white;
        background-color: $dox-white;
    }
}
</style>