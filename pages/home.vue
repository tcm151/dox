<script setup lang="ts">
definePageMeta({
    layout: 'simple'
})
let { data: trendingTopics } = useFetch("/api/trending/topics");
let { data: trendingUsers } = useFetch("/api/trending/users");

</script>

<template>
    <article class="row-wrap g-6 p-4">
        <section class="left pt-4">
            <span id="s1">DOX</span>
            <span id="s2">FOR</span>
            <span id="s3">EVERY</span>
            <span id="s4">THING</span>
            <div class="mt-6">
                <p>Information is</p>
                <p>for everyone.</p>
            </div>
        </section>
        <section class="right column g-4" style="grid-area: right">
            <div class="box trending column g-4 p-5">
                <div>
                    <h2>Trending Topics</h2>
                    <div class="topics my-2">
                        <div class="topic" v-for="item in trendingTopics" @click="navigateTo(`/topic/${extractId(item.topic)}`)">
                            <span id="t">{{ extractId(item.topic) }}</span>
                            <span id="c">+{{ item.count }}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h2>Trending Users</h2>
                    <div class="users mt-2">
                        <div class="info" v-for="user in trendingUsers" @click="navigateTo(`/user/${extractId(user.id)}`)">
                            <span id="i">{{ user.name }}</span>
                            <span id="s">+{{ user.score }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="box fill column p-5">
                <div class="content fill">
                    <h2 class="mt-0">Welcome to DOX</h2>
                    <p>The place for this, that, and everything. A new forum for the modern internet</p>
                    <p>Host your own personal blog, ask questions about scientific theories, share memes, write tutorials, create a fan page; the ideas are limitless on DOX.</p>
                    <p>Designed from the groud up with misinformation in mind, you can vote on just about everything. Use the voting system to make informed decisions when engaging with anything on DOX.</p>
                </div>
                <div class="buttons column g-2">
                    <button @click="navigateTo('/feed')">View Feed</button>
                    <button @click="navigateTo('/editor')">Write Post</button>
                    <button @click="navigateTo('/about')">About Us</button>
                </div>
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    height: 100%;
}

.box {
    border-radius: 0.5rem;
    background-color: $dox-white-ultra;
}

.left {
    flex: 10 1;
    @include flex-v;
    justify-content: center;
    align-items: center;
    text-align: center;

    span, p {
        transition: all 256ms;
    }

    @media only screen and (min-width: 1000px) {
        span {
            font-weight: 900;
            font-size: 12rem;
            line-height: 9.25rem;
        }

        p {
            font-weight: 800;
            font-size: 5rem;
            line-height: 4.25rem;
            color: $dox-black;
        }
    }

    @media only screen and (max-width: 1000px) {
        span {
            font-weight: 900;
            font-size: 7rem;
            line-height: 5.25rem;
        }

        p {
            font-weight: 800;
            font-size: 3rem;
            line-height: 2.5rem;
            color: $dox-black;
        }
    }

    span {
        background: linear-gradient(55deg, $dox-blue, $dox-purple);
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    
    p {
        color: $dox-black;
    }
}

.right {
    flex: 1 1 256px;
    white-space: normal;
}

.trending {
    @include flex-v;
    justify-content: space-evenly;
    text-align: left;
}

.topics, .users {
    @include flex-v (0.5rem);

    .info, .topic {
        cursor: pointer;
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