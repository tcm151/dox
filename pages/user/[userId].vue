<script setup lang="ts">
import type { Post, User } from '~~/types'

const route = useRoute();
const userId = route.params.userId as string

const user = computed(() => response.value?.user)
const posts = computed(() => response.value?.posts)
const { data: response, refresh } = await useAsyncData<{ user: User, posts: Post[] }>(() => {
    return $fetch(`/api/user/${userId}`)
})

const vote = useVoting()
const session = getSession()

let showSettings = ref(false)
let following = computed(() => session.user?.following.includes(`user:${userId}`))

async function followUser() {
    if (await session.follow(user.value!.id)) {
        await refresh()
    }
}

async function unfollowUser() {
    if (await session.unfollow(user.value!.id)) {
        await refresh()
    }
}
</script>


<template>
    <article class="user column g-2 p-4">
        <header class="profile column g-3 p-5">
            <section class="row g-2">
                <figure class="image is-64x64">
                    <img src="https://bulma.io/images/placeholders/64x64.png">
                </figure>
                <div class="name-follow row center-inline g-4">
                    <div class="column">
                        <h1>{{ user?.name }}</h1>
                        <a :href="user.link" v-if="user?.link">
                            {{ user?.link }}
                        </a>
                    </div>
                    <ClientOnly>
                        <div class="buttons row g-2" v-if="session.isAuthenticated">
                            <button v-if="user?.id == session.user.id" @click="navigateTo('/settings')">
                                <i class="fa-solid fa-gear"></i>
                                <span>Settings</span>
                            </button>
                            <button class="danger" v-else-if="following" @click="unfollowUser">
                                Unfollow
                            </button>
                            <button class="success" v-else @click="followUser">
                                Follow
                            </button>
                        </div>
                    </ClientOnly>
                </div>
            </section>
            <section class="row-wrap g-1">
                <Votes :target="user!" />
                <!-- TODO add popups to view these in more detail -->
                <Tag class="fill" type="link">
                    <strong>{{ user?.topics.length }}</strong> topics
                </Tag>
                <Tag class="fill" type="info">
                    <strong>{{ user?.followers.length }}</strong> followers
                </Tag>
                <Tag class="fill" type="info">
                    <strong>{{ user?.following.length }}</strong> following
                </Tag>
                <Tag class="fill" type="info">
                    joined <strong>{{ formatDate(user?.dateCreated ?? "") }}</strong>
                </Tag>
            </section>
            <section class="column g-2" v-if="user?.description">
                <p>{{ user.description }}</p>
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
    background-color: $dox-white-0;
}

.name-follow {
    flex: 1 1;
    justify-content: space-between;
    overflow-x: hidden;

    div.column {
        overflow-x: hidden;

        a {
            overflow-x: hidden;
            text-overflow: ellipsis;
        }
    }

    h1 {
        font-size: 1.5rem;
    }

    a {
        color: $dox-purple;
        cursor: pointer;
        font-weight: 600;
    }

    a:hover {
        text-decoration: underline;
    }
}

div.buttons {
    @media only screen and (max-width: 600px) {
        span {
            display: none;
        }
    }
}

.image {
    img {
        border-radius: 0.25rem;
    }
}

.tag.info, .tag.link {
    font-weight: 500;
}
</style>