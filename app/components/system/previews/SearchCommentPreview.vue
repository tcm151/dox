<script setup lang="ts">
import type { SearchComment } from '@@/shared/types'

const props = defineProps<{ comment: SearchComment }>()
const postUrl = computed(() => `/post/${extractId(props.comment.post.id)}#${encodeURIComponent(props.comment.id)}`)
</script>

<template>
    <div class="search-comment box background animate">
        <div class="main box column px-3 pt-3" @click="navigateTo(postUrl)">
            <div class="row wrap g-1">
                <Votes :target="comment" />
                <div class="row wrap f-2 g-1">
                    <UserTag class="f-1" :user="comment.user" />
                    <Tag class="f-2" type="link" icon="fa-comment" :label="`Comment From: ${comment.post.title}`" />
                </div>
                <div class="row wrap g-1">
                    <Tag v-if="comment.edited" class="meta">
                        <i class="fa-solid fa-stopwatch"></i>
                        {{ formatDate(comment.time) }}
                        <i class="fa-solid fa-eraser"></i>
                        {{ formatDate(comment.timeEdited) }}
                    </Tag>
                    <DurationTag v-else class="meta" :time="comment.time" />
                </div>
            </div>
            <Markdown class="content preview" :content="comment.content" />
        </div>
    </div>
</template>

<style scoped lang="scss">
.search-comment .main {
    overflow: hidden;
}

.search-comment:hover {
    cursor: pointer;
    @include shadow(1px, $blur: 0.25rem, $spread: 0.25rem, $color: #CCC1);
}

</style>