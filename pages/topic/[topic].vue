<script setup lang="ts">
const route = useRoute()
const topic = route.params.topic.toString()
const { info, posts, followers } = useTopic(topic)

const hints = useHints()
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
                        <button class="danger" v-if="following" @click="unfollowTopic">
                            Unfollow
                        </button>
                        <button class="success" v-else @click="followTopic">
                            Follow
                        </button>
                    </div>
                </ClientOnly>
            </section>
            <section class="row g-1 mt-4">
                <Votes :target="info.value!" />
                <Tag :fill="1" type="link">
                    <strong>{{ posts.items?.length }}</strong> posts
                </Tag>
                <Tag :fill="1" type="info" @click="showFollowers = !showFollowers">
                    <strong>{{ followers.value?.count }}</strong> followers
                </Tag>
                <Popup title="Followers" :visible="showFollowers" @accept="showFollowers = !showFollowers" @decline="showFollowers = !showFollowers" >
                    <!-- TODO show usernames of followers -->
                    <span v-for="user in followers.value">
                        {{ user }}
                    </span>
                </Popup>
            </section>
        </header>
        <LegacyFeed :posts="posts.items ?? []" :sorting="true" :pagination="true" />
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