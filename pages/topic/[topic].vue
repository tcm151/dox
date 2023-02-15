<script setup lang="ts">
const route = useRoute();
const topic = route.params.topic as string;

const { data: details, refresh } = await useFetch(`/api/topic/${topic}`);

const session = getSession();

let following = ref(false);

async function follow() {
    following.value = true;
    await session.follow("topic", topic)
    await refresh();
}

async function unfollow() {
    following.value = false;
    await session.unfollow("topic", topic)
    await refresh();
}

onMounted(() => {
    following.value = session.user?.topics.includes(topic) ?? false;
})

const events = useEvents();
events.subscribe("authenticatedUser", () => {
    following.value = session.user?.topics.includes(topic) ?? false;
})

let showFollowers = ref(false);
</script>

<template>
    <div id="topic" class="column g-2">
        <div class="details p-5">
            <div class="column">
                <div class="header">
                    <h1>{{ topic }}</h1>
                    <div>
                        <ClientOnly>
                            <span class="danger" v-if="following" @click="unfollow">Unfollow</span>
                            <span class="success" v-else @click="follow">Follow</span>
                        </ClientOnly>
                    </div>
                </div>
                <div class="row g-2 mt-4">
                    <div class="link">
                        <p><strong>{{ details?.posts.length }}</strong> posts</p>
                    </div>
                    <div class="info" @click="showFollowers = !showFollowers">
                        <p><strong>{{ details?.followers.count }}</strong> followers</p>
                    </div>
                    <Popup title="Followers" :visible="showFollowers" @accept="showFollowers = !showFollowers" @decline="showFollowers = !showFollowers" >
                        <!-- TODO show usernames -->
                    </Popup>
                </div>
            </div>
        </div>
        <Feed :posts="details?.posts ?? []" :sorting="true" :pagination="true" />
    </div>
</template>

<style scoped lang="scss">
@import "~/assets/global.scss";


#topic {
    @include fill-width(800px);
}

.details {
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;
}

.header {
    @include flex-h;
    justify-content: space-between;
    align-items: center;

    span {
        padding: 0.25rem 1rem;
        font-weight: 700;
        border-radius: 0.25rem;
    }
}

.row {
    white-space: nowrap;
}

.info, .link {
    padding: 0.25rem 1rem;
    border-radius: 0.25rem;
}

.info:hover {
    cursor: pointer;
}
</style>