<script setup lang="ts">
import { Post, User } from '~~/types';

const route = useRoute();
const userId = route.params.userId as string;

const user = computed(() => response.value?.user);
const posts = computed(() => response.value?.posts);
const { data: response, refresh } = await useAsyncData<{ user: User, posts: Post[] }>(() => {
    return $fetch(`/api/user/${userId}`)
})

const vote = useVoting()
const hints = useHints()
const events = useEvents()
const session = getSession()

let following = computed(() => session.user?.following.includes(`user:${userId}`))

async function followUser() {
    if (await session.follow("user", userId)) {
        await refresh();
    }
}

async function unfollowUser() {
    if (await session.unfollow("user", userId)) {
        await refresh();
    }
}
</script>


<template>
    <article class="user column g-2 p-4">
        <header class="profile column g-2 p-5">
            <section class="row g-2">
                <figure class="image is-64x64">
                    <img src="https://bulma.io/images/placeholders/64x64.png">
                </figure>
                <div class="name-follow">
                    <h1>{{ user?.name }}</h1>
                    <ClientOnly>
                        <button class="danger" v-if="following" @click="unfollowUser">
                            <span>Unfollow</span>
                        </button>
                        <button class="success" v-else @click="followUser">
                            <span>Follow</span>
                        </button>
                    </ClientOnly>
                </div>
            </section>
            <section class="follows row-wrap g-2">
                <!-- TODO add popups to view these in more detail -->
                <div class="votes row g-2">
                    <button class="positive" @click="vote.positive(user!.id, user!.votes)">
                        {{ user?.votes.positive.length }}
                    </button>
                    <button class="misleading" @click="vote.misleading(user!.id, user!.votes)">
                        {{ user?.votes.misleading.length }}
                    </button>
                    <button class="negative" @click="vote.negative(user!.id, user!.votes)">
                        {{ user?.votes.negative.length }}
                    </button>
                </div>
                <button class="link">
                    <span><strong>{{ user?.topics.length }}</strong> topics</span>
                </button>
                <button class="info">
                    <span><strong>{{ user?.followers.length }}</strong> followers</span>
                </button>
                <button class="info">
                    <span><strong>{{ user?.following.length }}</strong> following</span>
                </button>
                <button class="info">
                    <span>joined <strong>{{ formatDate(user?.dateCreated ?? "") }}</strong></span>
                </button>
            </section>
        </header>
        <Feed :posts="posts ?? []" :sorting="true" :pagination="true" />
    </article>
</template>

<style scoped lang="scss">
article.user {
    @include fit-width(800px, 1rem);
}

.profile {
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;
}

.name-follow {
    flex: 1 1;
    @include flex-h;
    justify-content: space-between;
    align-items: center;

    h1 {
        font-size: 1.5rem;
    }

    button {
        padding: 0.25rem 1rem;
        font-weight: 700;
        border-radius: 0.25rem;
    }
}

.image {
    img {
        border-radius: 0.25rem;
    }
}

.votes {
    > * {
        padding: 0.25rem 1rem;
        border-radius: 0.25rem;
        font-weight: 800;
        user-select: none;
    }
}

.follows {
    white-space: nowrap;
    text-align: center;

    > *:not(.votes) {
        flex: 1 1;
    }

    strong {
        font-weight: 800;
    }

    .info, .link {
        font-weight: 500;
        padding: 0.25rem 1rem;
        border-radius: 0.25rem;
    }
}

</style>