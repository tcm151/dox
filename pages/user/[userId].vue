<script setup lang="ts">
const route = useRoute();
const userId = route.params.userId as string;
const { data: response } = useFetch(`/api/user/${userId}`)
const user = computed(() => response.value?.user);
const posts = computed(() => response.value?.posts);

const session = getSession();
</script>


<template>
    <div class="profile-page column g-2">
        <div class="profile">
            <div class="row g-2 p-5">
                <div class="image is-96x96 mr-3">
                    <img src="https://bulma.io/images/placeholders/96x96.png">
                </div>
                <div class="column">
                    <div class="header">
                        <h1>{{ user?.name }}</h1>
                        <div>
                            <ClientOnly>
                                <span class="not-logged-in" v-if="user?.following.includes(session.user?.id ?? '')">Unfollow</span>
                                <span class="success" v-else>Follow</span>
                            </ClientOnly>
                        </div>
                    </div>
                    <div class="follows row g-2">
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
            </div>
        </div>
        <Feed :posts="posts ?? []" />
    </div>
</template>

<style scoped lang="scss">
@import "~/assets/global.scss";

.profile-page {
    @include fill-width(750px);

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
    height: 96px;

    img {
        border-radius: 0.25rem;
    }
}

.follows {
    white-space: nowrap;

    strong {
        font-weight: 800;
    }

    .info, .link {
        padding: 0.25rem 1rem;
        border-radius: 0.25rem;
    }
}

</style>