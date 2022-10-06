<script setup lang="ts">
import { inject } from 'vue';
import { Post } from '../../api/types';
import { navigateTo } from '../../services/router';
import { timeSince } from '../../services/dateTime';
import Tag from '../utilities/Tag.vue';
import { GetSession } from '../../services/store.new';

defineProps<{ posts: Post[] }>();

const session = GetSession();

const toggleModal = inject("toggleModal") as Function

function formatNumber(number: number): number | string {
    if (number > 999999) return ((number / 1000000).toFixed(0) + 'm')
    if (number > 999) return ((number / 1000).toFixed(0) + 'k')
    return number;
}

</script>


<template>
    <div v-if="posts.length > 0">
        <div class="post media box my-2 p-2" v-for="post in posts" :key="post.post_id">
            <div class="media-left pr-2 m-0">
                <div class="votes-left">
                    <p @click="session.upvote(post)"
                       class="vote is-size-8 has-text-centered has-text-weight-bold has-text-success">{{
                       formatNumber(post.votes?.upvotes.length)
                       }}</p>
                    <p @click="session.misleading(post)"
                       class="vote is-size-6 has-text-centered has-text-weight-bold has-text-warning">{{
                       formatNumber(post.votes?.misleading.length)
                       }}</p>
                    <p @click="session.downvote(post)"
                       class="vote is-size-6 has-text-centered has-text-weight-bold has-text-danger">{{
                       formatNumber(post.votes?.downvotes.length)
                       }}</p>
                </div>
            </div>
            <div class="media-content">
                <div class="post-title box m-0 is-shadowless has-background-light p-2"
                     @click="navigateTo(`/posts/${post.post_id}`)">
                    <p class="title is-5 has-text-weight-semibold m-0">{{ post.title }}</p>
                </div>
                <div class="pills">
                    <Tag v-for="topic in post?.topics" :label="topic" class="is-light is-link"
                         :route="`/topic/${topic}`" />
                    <Tag :label="`u/${post.user!.username}`" class="is-light is-primary"
                         :route="`/profile/${post.user?.username}`" />
                    <p class="tag is-light is-info ">{{ timeSince(post.time) }}</p>
                </div>
            </div>
        </div>
        <div class="box m-0 p-2 pagination is-small is-centered" role="navigation">
            <!-- <a class="pagination-previous is-disabled" title="This is the first page">Previous</a> -->
            <!-- <a class="pagination-next">Next</a> -->
            <ul class="pagination-list">
                <li><a class="pagination-link is-current">1</a></li>
                <li><a class="pagination-link">2</a></li>
                <li><a class="pagination-link">3</a></li>
                <li><span class="pagination-ellipsis">&hellip;</span></li>
                <li><a class="pagination-link">99</a></li>
            </ul>
        </div>
    </div>
    <div class="box content my-2" v-else>
        <i>There are no posts yet...</i>
    </div>
</template>


<style scoped lang="scss">
@import '../../styles/global.scss';

.post {
    padding: 0.25em;
    margin-bottom: 0.25em;
}

.media-left {
    width: 2em;
}

.votes-left {
    display: flex;
    flex-direction: column;

    p {
        line-height: 24px;
    }

    p:hover {
        cursor: pointer;
        background-color: $dox-grey;
        border-radius: 2px;
    }
}

.post-title:hover {
    cursor: pointer;
}

.media-content {
    align-self: center;
}

.pills {
    @include flex-hw;
    gap: 0.25em;

    margin-top: 0.25em;

    .tag {
        flex: 1 1 0;
        font-weight: 600;
    }
}

.topic {
    cursor: pointer;
}

.user-profile:hover {
    cursor: pointer;
}
</style>