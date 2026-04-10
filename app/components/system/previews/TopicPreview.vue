<script setup lang="ts">
import type { Topic } from '@@/shared/types'

const props = defineProps<{
    topic: Topic
}>()

const emit = defineEmits<{
    (event: "refresh"): void
}>()

const session = getSession()
const moderator = useModeration()
const connections = useFollowing()

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

let showFollow = computed(() => {
    return !session.user.topics.includes(props.topic.id)
})
</script>

<template>
    <main class="box column g-3 p-5">
        <section class="row g-2">
            <figure class="image is-64x64">
                <img src="https://bulma.io/assets/images/placeholders/64x64.png">
            </figure>
            <div class="row inline between f-1 g-4">
                <h2 @click="navigateTo(`/topic/${extractId(topic.id)}`)">
                    {{ extractId(topic.id) }}
                </h2>
                <Authenticated>
                    <div class="row g-2">
                        <ButtonSpinner v-if="showFollow" class="success small" :loading="loading" @click="followTopic">
                            Follow
                        </ButtonSpinner>
                        <ButtonSpinner v-if="!showFollow && !moderator.forTopic(topic)" class="danger small" :loading="loading" @click="unfollowTopic">
                            Unfollow
                        </ButtonSpinner>
                    </div>
                </Authenticated>
            </div>
        </section>
        <section class="row wrap g-1">
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
        </section>
        <section v-if="topic.description" class="column g-2">
            <p>{{ topic.description }}</p>
        </section>
    </main>
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

.image {
    img {
        border-radius: 0.25rem;
    }
}

.tag.info, .tag.link {
    font-weight: 500;
}
</style>