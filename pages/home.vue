<script setup lang="ts">
definePageMeta({
    layout: 'minimal'
})
let { data: trendingTopics } = useFetch("/api/trending/topics");
</script>

<template>
    <div class="grid g-5">
        <div class="left">
            <span>DOX</span>
            <span>FOR</span>
            <span>EVERY</span>
            <span>THING</span>
        </div>
        <!-- <div class="box center column p-5" style="grid-area: center">
            <h2>Welcome to DOX</h2>
            <div class="column g-3 mt-3" style="flex: 1 1">
                <p>The place for this, that, and everything.</p>
                <p><em>The open forum for the modern internet;</em> DOX aims to provide a platform for users to create intimate and diverse communities and engage with other users across limitless subjects.</p>
                <div class="buttons column g-2">
                    <button @click="navigateTo('/feed')">View Feed</button>
                    <button @click="navigateTo('/editor')">Write a Post</button>
                    <button @click="navigateTo('/notifications')">View Notifications</button>
                </div>
            </div>
        </div> -->
        <div class="box right p-5" style="grid-area: right;">
            <h2>Trending Topics</h2>
            <div class="topics my-3">
                <span class="topic" v-for="item in trendingTopics">
                    {{ item.topic }} +{{ item.count }}
                </span>
            </div>
            <h2>Trending Users</h2>
            <div class="users mt-3">
                <!-- TODO implement trending users -->
                <span class="info" v-for="index in 8">
                    {{ index }}
                </span>
            </div>
        </div>
        <div class="box bottom content p-5" style="grid-area: bottom">
            <h3>Best of Today</h3>
            <div class="my-3">
                <p>TBD</p>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">

.grid {
    height: calc(100% - 2rem);
    width: calc(100% - 2rem);
    padding: 1rem;
    
    display: grid;
    grid-template-columns: 3fr 2fr;
    grid-template-rows: 2fr 1fr;
    grid-template-areas: "left right"
                         "bottom bottom";
}

.box {
    border-radius: 0.5rem;
    background-color: $dox-white-ultra;
}

.left {
    @include flex-v;
    
    span {
        font-size: 10rem;
        font-weight: 900;
        line-height: 10rem;
        background: linear-gradient(55deg, $dox-blue, $dox-purple);
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }
}

// .center {
//     p {
//         text-align: justify;
//         hyphens: auto;
//     }

//     .buttons {
//         flex: 1 1;
//         justify-content: flex-end;
//     }
// }

.right {
    max-width: 100%;
    text-align: center;
}

.topics, .users {
    @include flex-v (0.5rem);

    span {
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-weight: 700;
    }
}
</style>