<script setup lang="ts">

const vote = useVoting()
const session = getSession()

const { data: topics } = await useAsyncData('topics', () => {
    return $fetch("/api/topic")
})

</script>

<template>
    <article class="column g-2 p-4">
        <div class="topic-item box column g-4 p-4" v-for="topic in topics">
            <header class="row center-inline">
                <h2 @click="navigateTo(`/topic/${extractId(topic.id)}`)">
                    {{ extractId(topic.id) }}
                </h2>
                <ClientOnly>
                    <div v-if="session.isAuthenticated">
                        <button class="tag danger" v-if="session.user?.topics.includes(topic.id)" @click="session.unfollow(topic.id)">
                            Unfollow
                        </button>
                        <button class="tag success" v-else @click="session.follow(topic.id)">
                            Follow
                        </button>
                    </div>
                </ClientOnly>
            </header>
            <div class="row g-1">
                <span class="tag positive" @click="vote.positive(topic)">
                    {{ topic.votes.positive.length }}
                </span>
                <span class="tag misleading" @click="vote.misleading(topic)">
                    {{ topic.votes.misleading.length }}
                </span>
                <span class="tag negative" @click="vote.negative(topic)">
                    {{ topic.votes.negative.length }}
                </span>
                <span class="tag link fill">
                    {{ 0 }} posts
                </span>
                <span class="tag info fill">
                    {{ 0 }} followers
                </span>
            </div>
        </div>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(500px, 1rem);
}

header.row {
    justify-content: space-between;
}

div.topic-item {
    h2 {
        cursor: pointer;  
    }
}
</style>