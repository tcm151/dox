<script setup lang="ts">
import type { Topic } from '~/types'

const props = defineProps<{
    topic: Topic
}>()

const emit = defineEmits<{
    (event: "refresh"): void
}>()

const session = getSession()
const connections = useFollowing()

let following = computed(() => {
    return session.user?.topics.includes(props.topic.id)
})

const loading = ref<boolean>(false)

async function followTopic() {
    loading.value = true
    await connections.follow(props.topic.id)
    loading.value = false
    emit("refresh")
}

async function unfollowTopic() {
    loading.value = true
    await connections.unfollow(props.topic.id)
    loading.value = false
    emit("refresh")
}

// TODO allow requesting for moderation of specific topics by approved users
// TODO allow admins to create predefined topics, which are the only ones that can be used
// TODO when adding topics in the editor, show preview of available/popular matching topics
</script>

<template>
    <div class="box column p-4">
        <header class="row inline between">
            <h1 @click="navigateTo(`/topic/${extractId(topic.id)}`)">
                {{ extractId(topic.id) }}
            </h1>
            <ClientOnly>
                <div v-if="session.isAuthenticated" class="follow">
                    <ButtonSpinner v-if="following" class="danger small" :loading="loading" @click="unfollowTopic">
                        Unfollow
                    </ButtonSpinner>
                    <ButtonSpinner v-else class="success small" :loading="loading" @click="followTopic">
                        Follow
                    </ButtonSpinner>
                </div>
            </ClientOnly>
        </header>
        <footer class="row wrap g-1 mt-2">
            <Votes :target="topic" />
            <Tag class="f-1" type="link">
                <strong>{{ topic.visits }}</strong> visits
            </Tag>
            <Tag class="f-1" type="link">
                <strong>{{ topic.posts.length }}</strong> posts
            </Tag>
            <Tag class="f-1" type="link">
                <strong>{{ topic.threads.length }}</strong> threads
            </Tag>
            <Tag class="f-1" type="info" @click="navigateTo(`/topic/${extractId(topic.id)}/followers`)">
                <strong>{{ topic.followers.length }}</strong> followers
            </Tag>
            <Tag class="f-1" type="info">
                first used <strong>{{ formatDate(topic.firstUsed) }}</strong> ago
            </Tag>
        </footer>
    </div>
</template>

<style scoped lang="scss">
div.box:hover {
    @include shadow(1px, $blur: 0.25rem, $spread: 0.25rem, $color: #CCC1);
}

header h1 {
    cursor: pointer;
    font-size: 1.5rem;

}

div.follow {
    button {
        width: 6rem;
    }
}

.tag.info, .tag.link {
    font-weight: 500;
}
</style>