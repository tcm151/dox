<script setup lang="ts">
const route = useRoute();
const topic = route.params.topic as string;

const { data: details } = useFetch(`/api/topic/${topic}`);

const session = getSession();
</script>

<template>
    <div id="topic" class="column g-2">
        <div class="details p-5">
            <div class="column">
                <div class="header">
                    <h1>{{ topic }}</h1>
                    <div>
                        <ClientOnly>
                            <span class="danger" v-if="session.user?.topics.includes(topic)">Unfollow</span>
                            <span class="success" v-else>Follow</span>
                        </ClientOnly>
                    </div>
                </div>
                <div class="row g-2 mt-4">
                    <div class="link">
                        <p><strong>{{ details?.posts.length }}</strong> posts</p>
                    </div>
                    <div class="info">
                        <p><strong>{{ details?.followers.count }}</strong> followers</p>
                    </div>
                </div>
            </div>
        </div>
        <Feed :posts="details?.posts ?? []" />
    </div>
</template>

<style scoped lang="scss">
@import "~/assets/global.scss";


#topic {
    @include fill-width(750px);
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
</style>