<script setup lang="ts">
import type { Post, User } from "~/types"

const props = defineProps<{
    posts: Post[]
    loading?: boolean
    sorting?: boolean
    pagination?: boolean
    page?: number
}>()

const emit = defineEmits<{
    (event: 'refresh'): void
    (event: 'page', pageNumber: number): void
    (event: 'pageSize', size: number): void
}>()

const vote = useVoting();
const session = getSession()
const settings = useUserSettings();

onMounted(() => sortBy(props.posts, sortType.value))
watch(props.posts, () => {
    sortBy(props.posts, sortType.value)
})

const spinRefresh = ref(false)
watch(() => props.loading, (loading) => {
    if (loading) {
        spinRefresh.value = true
    }
    else {
        setTimeout(() => spinRefresh.value = false, 512)
    }
})

let sortType = ref("new")
function sort(type: string) {
    sortType.value = type
    sortBy(props.posts, type)
}

</script>

<template>
    <div class="feed">
        <div class="sorting row center g-2" v-if="props.sorting">
            <!-- REFACTOR sorting needs to be done from the database -->
            <button class="refresh" @click="emit('refresh')">
                <i class="fa-solid fa-rotate" :class="{ spin: spinRefresh }"></i>
            </button>
            <slot name="header" />
            <button @click="sort('new')" :class="{ selected: sortType === 'new' }">
                <i class="fa-solid fa-egg"></i>
                <span>New</span>
            </button>
            <button @click="sort('hot')" :class="{ selected: sortType === 'hot' }">
                <i class="fa-solid fa-fire"></i>
                <span>Hot</span>
            </button>
            <button @click="sort('top')" :class="{ selected: sortType === 'top' }">
                <i class="fa-solid fa-ranking-star"></i>
                <span>Top</span>
            </button>
        </div>
        <TransitionGroup name="feed">
            <div class="post" :class="{ 'animate': settings.state.hoverAnimations }" v-for="post in posts" :key="post.id">
                <!-- TODO allow for pinned posts -->
                <div class="reply-to row center-inline g-2" v-if="(post.replyTo as Post).id != null" @click="navigateTo(`/post/${extractId(post.id!)}`)">
                    <i class="fa-solid fa-reply-all fa-flip-horizontal"></i>
                    <p>{{ (post.replyTo as Post).title }}</p>
                </div>
                <div class="main">
                    <div class="row-wrap g-1">
                        <div class="votes row g-1">
                            <span class="tag positive" @click="vote.positive(post)" :class="{ voted: post.votes.positive.includes(session.user.id)}">
                                {{ post?.votes.positive.length }}
                            </span>
                            <span class="tag misleading" @click="vote.misleading(post)" :class="{ voted: post.votes.misleading.includes(session.user.id)}">
                                {{ post?.votes.misleading.length }}
                            </span>
                            <span class="tag negative" @click="vote.negative(post)" :class="{ voted: post.votes.negative.includes(session.user.id)}">
                                {{ post?.votes.negative.length }}
                            </span>
                            <span class="tag link" v-if="post.votes.awards && post.votes.awards.length > 0">
                                <i class="fa-solid fa-crown"></i>
                                <span>{{ post.votes.awards.length }}</span>
                            </span>
                            <span class="tag link" v-if="post.votes.saves && post.votes.saves.length > 0">
                                <i class="fa-solid fa-box-archive"></i>
                                <span>{{ post.votes.saves.length }}</span>
                            </span>
                        </div>
                        <span class="tag topic" v-for="topic in post.topics" @click.stop="navigateTo(`/topic/${topic.split(':')[1]}`)">
                            {{ topic.split(':')[1] }}
                        </span>
                        <div class="details row g-1">
                            <span class="tag info" @click="navigateTo(`/user/${extractId((post.user as User).id ?? '')}`)">
                                <i class="fa-solid fa-user"></i>
                                <span>{{ (post.user as User).name ?? "deleted" }}</span>
                            </span>
                            <span class="tag info comments">
                                <i class="fa-solid fa-comment-dots"></i>
                                <span>{{ post.comments.length }}</span>
                            </span>
                            <span class="tag info time">
                                <i class="fa-solid fa-calendar"></i>
                                <span>{{ formatDate(post.time as any) }}</span>
                            </span>
                        </div>
                    </div>
                    <h3 class="title mt-1" @click="navigateTo(`/post/${extractId(post.id!)}`)">
                        {{ post.title }}
                    </h3>
                </div>
            </div>
        </TransitionGroup>
        <!-- TODO allow more than five pages -->
        <div class="pagination" v-if="pagination">
            <i class="fa-solid fa-caret-left" @click="emit('page', props.page! - 1)"></i>
            <span :class="{ current: page! == 1 }" @click="emit('page', 1)">1</span>
            <span :class="{ current: page! == 2 }" @click="emit('page', 2)">2</span>
            <span :class="{ current: page! == 3 }" @click="emit('page', 3)">3</span>
            <span :class="{ current: page! == 4 }" @click="emit('page', 4)">4</span>
            <span :class="{ current: page! == 5 }" @click="emit('page', 5)">5</span>
            <i class="fa-solid fa-caret-right" @click="emit('page', props.page! + 1)"></i>
        </div>
    </div>
</template>

<style scoped lang="scss">

@keyframes spin {
    from {
        transform: rotateZ(0deg);
    }
    to {
        transform: rotateZ(360deg);
    }
}

.feed {
    @include flex-v (0.5rem);
}

.sorting {
    button {
        flex: 1 1;
        
        @media only screen and (max-width: 400px) {
            span {
                display: none;
            }    
        }
    }


    .refresh {
        flex: 0 1;
        color: $dox-white-2;
        background-color: $dox-black-0;

        i.spin {
            animation: spin 512ms linear infinite;
        }
    }

    .refresh:hover {
        background-color: $dox-black-2;
    }

    .selected {
        color: $dox-white-0;
        background-color: $dox-white-3;
    }

    // .selected:hover {
    //     color: $dox-white-3;
    //     background-color: $dox-white-1;
    //     border: 0.2rem solid $dox-white-3;
    // }
}

.feed-move, .feed-enter-active, .feed-leave-active {
    transition: all 512ms ease;
}

.feed-enter-from, .feed-leave-to {
    opacity: 0;
}

// .feed-leave-active {
//     position: absolute;
// }

.post {
    border-radius: 0.25rem;
    background-color: $dox-white-3;
    transition: transform 128ms;
    
    .main {
        padding: 0.75rem;
        border-radius: 0.25rem;
        background-color: $dox-white-0;
    }

    .reply-to + .main {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
    }

    .reply-to {
        padding: 0.25rem 0.5rem 0.25rem 0.5rem;
        font-weight: 700;
        color: $dox-white-0;
        
        p {
            overflow-x: hidden;
            text-overflow: ellipsis;
            letter-spacing: 0.025rem;
        }
    }
}

.post:hover {
    cursor: pointer;
    @include shadow(1px, $blur: 0.25rem, $spread: 0.25rem, $color: #CCC1);
}

.post.animate:hover {
    transform: scale(102%, 105%);
}

.row {
    white-space: nowrap;
}

.votes {
    flex: 0 1;
    
    span.tag {
        font-weight: 800;
        user-select: none;
    }

    span.positive, span.misleading, span.negative {
        width: 0.5rem;
    }
}

.topic {
    flex: 10 1 1rem;
}

div.details {
    flex: 1 1;

    .info {
        flex: 1 1 1rem;
    }
}

.pagination {
    @include flex-h (0.5rem);
    justify-content: center;

    span, i {
        width: 2rem;
        padding: 0.25rem 0;
        font-size: 1rem;
        font-weight: 700;
        text-align: center;
        line-height: 20px;
        border-radius: 0.25rem;
        background-color: $dox-white-2;
    }

    span:hover, i:hover {
        cursor: pointer;
        color: $dox-white-0;
        background-color: $dox-white-3;
    }

    .current {
        color: $dox-white-2;
        background-color: $dox-black-0;
    }

    .current:hover {
        background-color: $dox-black-2;
    }
}
</style>