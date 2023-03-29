<script setup lang="ts">

const route = useRoute();
const userId = route.params.userId as string;

const { data: response, refresh } = await useFetch(`/api/user/${userId}`)
const user = computed(() => response.value?.user);
const posts = computed(() => response.value?.posts);

const vote = useVoting();
const session = getSession();

let following = ref(false);

async function follow() {
    if (await session.follow("user", userId)) {
        following.value = true;
        await refresh();
    }
}

async function unfollow() {
    if (await session.unfollow("user", userId)) {
        following.value = false;
        await refresh();
    }
}

onMounted(() => {
    following.value = session.user?.following.includes(`user:${userId}`) ?? false;
})

const events = useEvents();
events.subscribe("authenticatedUser", () => {
    following.value = session.user?.following.includes(`user:${userId}`) ?? false;
})

</script>


<template>
    <div class="profile-page column g-2">
        <div class="profile column g-2 p-5">
            <div class="row g-2">
                <div class="image is-64x64 mr-3">
                    <img src="https://bulma.io/images/placeholders/64x64.png">
                </div>
                <div class="column">
                    <div class="header">
                        <h1>{{ user?.name }}</h1>
                        <div>
                            <ClientOnly>
                                <span class="danger" v-if="following" @click="unfollow">Unfollow</span>
                                <span class="success" v-else @click="follow">Follow</span>
                            </ClientOnly>
                        </div>
                    </div>
                </div>
            </div>
            <div class="follows row-wrap g-2">
                <!-- TODO add popups to view these in more detail -->
                <!-- TODO looks like shit on mobile -->
                <div class="votes row g-2">
                    <span class="positive" @click="vote.positive(user!.id, user!.votes)">
                        {{ user?.votes.positive.length }}
                    </span>
                    <span class="misleading" @click="vote.misleading(user!.id, user!.votes)">
                        {{ user?.votes.misleading.length }}
                    </span>
                    <span class="negative" @click="vote.negative(user!.id, user!.votes)">
                        {{ user?.votes.negative.length }}
                    </span>
                </div>
                <div class="link">
                    <p><strong>{{ user?.topics.length }}</strong> topics</p>
                </div>
                <div class="info">
                    <p><strong>{{ user?.followers.length }}</strong> followers</p>
                </div>
                <div class="info">
                    <p><strong>{{ user?.following.length }}</strong> following</p>
                </div>
                <div class="info">
                    <p>joined <strong>{{ formatDate(user?.dateCreated ?? "") }}</strong></p>
                </div>
            </div>
        </div>
        <Feed :posts="posts ?? []" :sorting="true" :pagination="true" />
    </div>
</template>

<style scoped lang="scss">
.profile-page {

    .not-logged-in {
        padding: 0.5rem 1rem;
        text-align: center;
        font-weight: 700;
        border-radius: 0.25rem;
        color: $dox-white-ultra;
        background-color: $dox-red;
    }
}

.profile {
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;

    .row {
        align-items: stretch;   
    }
}

.header {
    flex: 1 1;
    @include flex-h;
    justify-content: space-between;
    align-items: center;

    span {
        padding: 0.25rem 1rem;
        font-weight: 700;
        border-radius: 0.25rem;
    }
}

.image {
    flex: 0 1;
    height: 64px;

    img {
        border-radius: 0.25rem;
    }
}

.votes {
    flex: 0 1;
    
    > * {
        padding: 0.25rem 1rem;
        border-radius: 0.25rem;
        font-weight: 800;
        user-select: none;
    }
}

.follows {
    white-space: nowrap;
    text-align: center;

    strong {
        font-weight: 800;
    }

    .info, .link {
        padding: 0.25rem 1rem;
        border-radius: 0.25rem;
    }
}

</style>