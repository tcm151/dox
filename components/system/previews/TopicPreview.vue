<script setup lang="ts">
import type { Topic } from '~/types'

const props = defineProps<{
    topic: Topic
}>()

const session = getSession()
const settings = useUserSettings()


let showFollowers = ref(false)
let following = computed(() => {
    return session.user?.topics.includes(props.topic.id)
})

const loading = ref<boolean>(false)

async function followTopic() {
    loading.value = true
    await session.follow(props.topic.id)
    loading.value = false
}

async function unfollowTopic() {
    loading.value = true
    await session.unfollow(props.topic.id)
    loading.value = false
}
</script>

<template>
    <div class="box column p-4" :class="{ 'animate': settings.user.hoverAnimations }">
        <header class="row center-inline space-between">
            <h1 @click="navigateTo(`/topic/${extractId(topic.id)}`)">
                {{ extractId(topic.id) }}
            </h1>
            <ClientOnly>
                <div class="follow" v-if="session.isAuthenticated">
                    <ButtonSpinner v-if="following" :loading="loading" class="small danger" @click="unfollowTopic">
                        Unfollow
                    </ButtonSpinner>
                    <ButtonSpinner v-else class="small success" :loading="loading" @click="followTopic">
                        Follow
                    </ButtonSpinner>
                    <!-- <Tag v-if="following" class="danger px-4 py-2" width="4rem" label="Unfollow" @click="unfollowTopic" />
                    <Tag v-else class="success px-4 py-2" width="4rem" label="Follow" @click="followTopic" /> -->
                </div>
            </ClientOnly>
        </header>
        <footer class="row-wrap g-1 mt-2">
            <Votes :target="topic" />
            <Tag class="f-1 b-0" type="link">
                <strong>{{ topic.posts.length }}</strong> posts
            </Tag>
            <Tag class="f-1 b-0" type="link">
                <strong>{{ topic.threads.length }}</strong> threads
            </Tag>
            <Tag class="f-1 b-0" type="info">
                <strong>{{ topic.followers.length }}</strong> followers
            </Tag>
            <Tag class="f-1 b-0" type="info">
                first used <strong>{{ formatDate(topic.firstUsed) }}</strong>
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
div.box:hover {
    @include shadow(1px, $blur: 0.25rem, $spread: 0.25rem, $color: #CCC1);
}

div.box.animate:hover {
    transform: scale(102%, 105%);
    transition: transform 128ms;
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