<script setup lang="ts">
const route = useRoute()
const topic = route.params.topic.toString()

const { info, posts, followers } = useTopic(topic)

const vote = useVoting()
const hints = useHints()
const events = useEvents()
const session = getSession()

let showFollowers = ref(false)
let following = computed(() => session.user?.topics.includes(`topic:${topic}`))

async function followTopic() {
    try {
        await session.follow(info.value!.id)
        await followers.fetch()
    }
    catch (error: any) {
        hints.addError(error.message)
    }
}

async function unfollowTopic() {
    try {
        await session.unfollow(info.value!.id)
        await followers.fetch()
    }
    catch (error: any) {
        hints.addError(error.message)
    }
}
</script>

<template>
    <article class="topic-info column g-2 p-4">
        <header class="column p-5">
            <section class="name-follow row">
                <h1>{{ topic }}</h1>
                <ClientOnly>
                    <div v-if="session.isAuthenticated">
                        <button class="tag danger" v-if="following" @click="unfollowTopic">
                            Unfollow
                        </button>
                        <button class="tag success" v-else @click="followTopic">
                            Follow
                        </button>
                    </div>
                </ClientOnly>
            </section>
            <section class="row g-1 mt-4">
                <div class="votes row g-1">
                    <span class="tag positive" @click="vote.positive(info.value)">
                        {{ info.value?.votes.positive.length }}
                    </span>
                    <span class="tag misleading" @click="vote.misleading(info.value)">
                        {{ info.value?.votes.misleading.length }}
                    </span>
                    <span class="tag negative" @click="vote.negative(info.value)">
                        {{ info.value?.votes.negative.length }}
                    </span>
                </div>
                <span class="tag link fill">
                    <strong>{{ posts.items?.length }}</strong> posts
                </span>
                <span class="tag info fill" @click="showFollowers = !showFollowers">
                    <strong>{{ followers.value?.count }}</strong> followers
                </span>
                <Popup title="Followers" :visible="showFollowers" @accept="showFollowers = !showFollowers" @decline="showFollowers = !showFollowers" >
                    <!-- TODO show usernames of followers -->
                    <span v-for="user in followers.value">
                        {{ user }}
                    </span>
                </Popup>
            </section>
        </header>
        <Feed :posts="posts.items ?? []" :sorting="true" :pagination="true" />
    </article>
</template>

<style scoped lang="scss">

.topic-info {
    @include fit-width(800px, 1rem);
}

header {
    border-radius: 0.25rem;
    background-color: $dox-white-0;
}

.name-follow {
    justify-content: space-between;

    h1 {
        font-size: 1.5rem;
    }
}

.tag.info, .tag.link {
    font-weight: 500;
}
</style>