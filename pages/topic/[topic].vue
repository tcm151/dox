<script setup lang="ts">
const route = useRoute()
const topic = route.params.topic as string

const { data: topicInfo, refresh } = await useFetch(`/api/topic/${topic}`)

const vote = useVoting()
const hints = useHints()
const events = useEvents()
const session = getSession()

let showFollowers = ref(false)
let following = computed(() => session.user?.topics.includes(topic))

async function followTopic() {
    try {
        await session.follow("topic", topic)
        await refresh();
    }
    catch (error: any) {
        hints.addError(error.message)
    }
}

async function unfollowTopic() {
    try {
        await session.unfollow("topic", topic)
        await refresh()
    }
    catch (error: any) {
        hints.addError(error.message)
    }
}
</script>

<template>
    <article class="topic-info column g-2 p-4">
        <header class="column p-5">
            <section class="name-follow">
                <h1>{{ topic }}</h1>
                <ClientOnly>
                    <button class="danger" v-if="following" @click="unfollowTopic">
                        <span>Unfollow</span>
                    </button>
                    <button class="success" v-else @click="followTopic">
                        <span>Follow</span>
                    </button>
                </ClientOnly>
            </section>
            <section class="row g-2 mt-4">
                <!-- TODO create topics table -->
                <!-- TODO allow voting directly on topics -->
                <div class="votes row g-2">
                    <button class="positive" @click="">
                        <span>{{ 1 }}</span>
                    </button>
                    <button class="misleading" @click="">
                        <span>{{ 1 }}</span>
                    </button>
                    <button class="negative" @click="">
                        <span>{{ 1 }}</span>
                    </button>
                </div>
                <button class="link">
                    <p><strong>{{ topicInfo?.posts.length }}</strong> posts</p>
                </button>
                <button class="info" @click="showFollowers = !showFollowers">
                    <p><strong>{{ topicInfo?.followers.count }}</strong> followers</p>
                </button>
                <Popup title="Followers" :visible="showFollowers" @accept="showFollowers = !showFollowers" @decline="showFollowers = !showFollowers" >
                    <!-- TODO show usernames of followers -->
                    <span v-for="user in topicInfo?.followers">
                        {{ user }}
                    </span>
                </Popup>
            </section>
        </header>
        <Feed :posts="topicInfo?.posts ?? []" :sorting="true" :pagination="true" />
    </article>
</template>

<style scoped lang="scss">

.topic-info {
    @include fit-width(800px, 1rem);
}

header {
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;
    white-space: nowrap;
}

.name-follow {
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

.votes {
    > * {
        padding: 0.25rem 1rem;
        border-radius: 0.25rem;
        font-weight: 800;
        user-select: none;
    }
}

section.row {
    > *:not(.votes) {
        flex: 1 1;
    }
}

.info, .link {
    font-weight: 500;
    padding: 0.25rem 1rem;
    border-radius: 0.25rem;
}

.info:hover {
    cursor: pointer;
}
</style>