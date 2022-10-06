<script setup lang="ts">
import { userInfo } from 'os';
import { computed } from 'vue';
import { User } from '../../api/types';
import { GetSession } from '../../services/store.new'
import EventBus from '../../services/events';
import axios from 'axios';

const props = defineProps<{ user: User }>()

const session = GetSession()

const isFollowing = computed(() => {
    if (!session.isAuthenticated) {
        return false;
    }

    return props.user?.followers.includes(session.User!.user_id)
})

function follow() {
    if (!session.isAuthenticated) {
        EventBus.publish("userNotAuthenticated");
        return;
    }

    axios.post(`https://doxforeverything.herokuapp.com/user/${props.user.user_id}/following`, new URLSearchParams({ following: JSON.stringify(props.user.following) }))

    props.user.followers.push(session.User!.user_id);
}

function unfollow() {
    props.user.followers = props.user.followers.filter(id => id !== session.User!.user_id);
}

</script>

<template>
    <div class="information box p-4 mb-2">
        <div class="profile-header">
            <figure class="profile-picture image is-64x64">
                <img src="https://bulma.io/images/placeholders/64x64.png">
            </figure>
            <div class="info">
                <p class="username">{{ user?.username }}</p>
                <div class="stats">
                    <div class="follow">
                        <p class="count">{{ user?.followers.length }}</p>
                        <p class="label">Followers</p>
                    </div>
                    <div class="follow">
                        <p class="count">{{ user?.following.length }}</p>
                        <p class="label">Following</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="interactions">
            <button v-if="isFollowing" class="button is-small is-light is-success" @click="unfollow">Unfollow</button>
            <button v-else class="button is-small is-light is-success" @click="follow">Follow</button>
            <button class="button is-small is-light is-link">Message</button>
            <button class="button is-small is-light is-danger">Block</button>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '../../styles/global.scss';

.profile-header {
    @include flex-h;
    margin-bottom: 0.5em;

    figure {
        margin-right: 0.5em;

        img {
            border-radius: 0.5em;
        }
    }
}

.info {
    @include flex-v (0.25em);
    justify-content: center;

    .username {
        font-size: 1.5em;
        font-weight: 900;
        line-height: 1.25em;
    }

    .stats {
        @include flex-h (1em);

        .follow {
            @include flex-h (0.25em);

            .count {
                font-size: 1em;
                line-height: 1.25em;
                font-weight: 700;
            }

            .label {
                font-size: 1em;
                line-height: 1.25em;
                font-weight: 500;
            }
        }
    }
}

.interactions {
    @include flex-hw (0.5em);

    button {
        flex: 1 1 0;
        padding: 0em 1em;
        font-weight: 500;
    }
}
</style>