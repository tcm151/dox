<script setup lang="ts">
definePageMeta({
    layout: 'minimal'
})
let { data: trendingTopics } = useFetch("/api/trending/topics");
let { data: trendingUsers } = useFetch("/api/trending/users");

</script>

<template>
    <div class="grid g-4">
        <section class="left">
            <span id="s1">DOX</span>
            <span id="s2">FOR</span>
            <span id="s3">EVERY</span>
            <span id="s4">THING</span>
            <div>
                <p>Information is</p>
                <p>for everyone.</p>
            </div>
        </section>
        <section class="column right g-4" style="grid-area: right">
            <div class="box trending column g-4 p-5">
                <div>
                    <h2>Trending Topics</h2>
                    <div class="topics my-2">
                        <div class="topic" v-for="item in trendingTopics">
                            <span id="t">{{ item.topic }}</span>
                            <span id="c">+{{ item.count }}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h2>Trending Users</h2>
                    <div class="users mt-2">
                        <span class="info" v-for="user in trendingUsers">
                            <span id="i">{{ user.name }}</span>
                            <span id="s">+{{ user.score }}</span>
                        </span>
                    </div>
                </div>
            </div>
            <div class="box fill column p-5">
                <div class="content fill">
                    <h2 class="mt-0">Welcome to DOX</h2>
                    <p>The place for this, that, and everything.</p>
                    <p><em>The open forum for the modern internet;</em> DOX aims to provide a platform for users to create intimate and diverse communities and engage with other users across limitless subjects.</p>
                </div>
                <div class="buttons column g-2">
                    <button @click="navigateTo('/feed')">View Feed</button>
                    <button @click="navigateTo('/editor')">Write a Post</button>
                    <button @click="navigateTo('/notifications')">View Notifications</button>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped lang="scss">

.grid {
    height: calc(100% - 2rem);
    width: calc(100% - 2rem);
    padding: 1rem;
    
    display: grid;
    grid-template-columns: 3fr 1fr;
    grid-template-areas: "left right"
}

.box {
    border-radius: 0.5rem;
    background-color: $dox-white-ultra;
}

.left {
    @include flex-v;
    justify-content: center;
    align-items: center;
    text-align: center;

    span {
        font-weight: 900;
        font-size: 12rem;
        line-height: 9.25rem;
        background: linear-gradient(55deg, $dox-blue, $dox-purple);
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    div {
    margin-top: 2.5rem;

        p {
            font-weight: 800;
            font-size: 5rem;
            line-height: 4.25rem;
            color: $dox-black;
        }
    }
}

.right {
    min-width: 400px;
}

.trending {
    @include flex-v;
    justify-content: space-evenly;
    text-align: left;
}

.topics, .users {
    @include flex-v (0.5rem);

    .info, .topic {
        padding: 0.25rem 1rem;
        border-radius: 0.25rem;
        font-weight: 700;
    }

    .info, .topic {
        @include flex-h (0.25rem);
        justify-content: flex-end;

        #i, #t {
            flex: 1 1
        }
    }
}
</style>