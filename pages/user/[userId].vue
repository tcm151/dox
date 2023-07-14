<script setup lang="ts">
import { Post, User } from '~~/types'

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
    if (await session.follow("user", userId)) {
        await refresh()
    }
}

async function unfollowUser() {
    if (await session.unfollow("user", userId)) {
        await refresh()
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
                <div class="name-follow row center-inline">
                    <h1>{{ user?.name }}</h1>
                    <ClientOnly>
                        <div class="row g-2" v-if="session.isAuthenticated">
                            <button v-if="user?.id == session.user.id" @click="showSettings = true">
                                <i class="fa-solid fa-gear"></i>
                                <span>Settings</span>
                            </button>
                            <button class="tag danger" v-else-if="following" @click="unfollowUser">
                                Unfollow
                            </button>
                            <button class="tag success" v-else @click="followUser">
                                Follow
                            </button>
                            <Settings :visible="showSettings" @close="showSettings = false" />
                        </div>
                    </ClientOnly>
                </div>
            </section>
            <section class="row-wrap g-1">
                <!-- TODO add popups to view these in more detail -->
                <div class="votes row g-1">
                    <span class="tag positive" @click="vote.positive(user ?? null)" :class="{ voted: user?.votes.positive.includes(session.user.id) }">
                        {{ user?.votes.positive.length }}
                    </span>
                    <span class="tag misleading" @click="vote.misleading(user ?? null)" :class="{ voted: user?.votes.misleading.includes(session.user.id) }">
                        {{ user?.votes.misleading.length }}
                    </span>
                    <span class="tag negative" @click="vote.negative(user ?? null)" :class="{ voted: user?.votes.negative.includes(session.user.id) }">
                        {{ user?.votes.negative.length }}
                    </span>
                </div>
                <span class="tag link fill">
                    <strong>{{ user?.topics.length }}</strong> topics
                </span>
                <span class="tag info fill">
                    <strong>{{ user?.followers.length }}</strong> followers
                </span>
                <span class="tag info fill">
                    <strong>{{ user?.following.length }}</strong> following
                </span>
                <span class="tag info fill">
                    joined <strong>{{ formatDate(user?.dateCreated ?? "") }}</strong>
                </span>
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
    justify-content: space-between;

    h1 {
        font-size: 1.5rem;
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