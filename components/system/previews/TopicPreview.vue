<script setup lang="ts">
import type { Topic } from '~/types'

const props = defineProps<{
    topic: Topic
}>()

const hints = useHints()
const session = getSession()

let showFollowers = ref(false)
let following = computed(() => session.user?.topics.includes(props.topic.id))

async function followTopic() {
    try {
        await session.follow(props.topic.id)
        // await followers.fetch()
    }
    catch (error: any) {
        hints.addError(error.message)
    }
}

async function unfollowTopic() {
    try {
        await session.unfollow(props.topic.id)
        // await followers.fetch()
    }
    catch (error: any) {
        hints.addError(error.message)
    }
}

</script>

<template>
    <div class="box column p-5">
        <header class="name-follow row space-between">
            <h1 @click="navigateTo(`/topic/${extractId(topic.id)}`)">
                {{ extractId(topic.id) }}
            </h1>
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
        </header>
        <footer class="row g-1 mt-3">
            <Votes :target="topic" />
            <Tag :fill="1" type="link">
                <strong>{{ topic.posts.length }}</strong> posts
            </Tag>
            <Tag :fill="1" type="link">
                <strong>{{ topic.threads.length }}</strong> threads
            </Tag>
            <Tag :fill="1" type="info">
                <strong>{{ topic.followers.length }}</strong> followers
            </Tag>
            <!-- TODO show usernames of followers -->
            <!-- <Popup title="Followers" :visible="showFollowers" @accept="showFollowers = !showFollowers" @decline="showFollowers = !showFollowers" >
                <span v-for="user in followers.value">
                    {{ user }}
                </span>
            </Popup> -->
        </footer>
    </div>
</template>

<style scoped lang="scss">
header {
    h1 {
        font-size: 1.5rem;
        cursor: pointer;
    }
}

.tag.info, .tag.link {
    font-weight: 500;
}
</style>