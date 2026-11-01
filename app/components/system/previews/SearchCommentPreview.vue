<script setup lang="ts">
import type { SearchComment } from '@@/shared/types'

const props = defineProps<{ comment: SearchComment }>()
const contextUrl = computed(() => {
    const context = props.comment.context
    const table = "title" in context ? "post" : "gallery"
    return `/${table}/${extractId(context.id)}#${encodeURIComponent(props.comment.id)}`
})
const contextName = computed(() => "title" in props.comment.context
    ? props.comment.context.title
    : props.comment.context.description)
</script>

<template>
    <div class="search-comment clickable box background animate hover-shadow">
        <div class="main box column px-3 pt-3" @click="navigateTo(contextUrl)">
            <div class="row wrap g-1">
                <Votes :target="comment" />
                <div class="row wrap f-2 g-1">
                    <UserTag class="f-1" :user="comment.user" />
                    <Tag class="f-2" type="link" icon="fa-comment" :label="`Comment On: ${contextName}`" />
                </div>
                <div class="row wrap g-1">
                    <ModerationState :moderation="comment.moderation" content-type="comment" />
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

</style>