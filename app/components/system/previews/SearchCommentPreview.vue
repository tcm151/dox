<script setup lang="ts">
import type { SearchComment } from '@@/shared/types'

const props = defineProps<{ comment: SearchComment }>()
const contextUrl = computed(() => {
    const context = props.comment.context
    const table = "url" in context ? "link" : "description" in context ? "gallery" : "post"
    return `/${table}/${extractId(context.id)}#${encodeURIComponent(props.comment.id)}`
})
const contextName = computed(() => props.comment.context.title)
</script>

<template>
    <ContentVisibility :tags="comment.context.tags">
        <div class="search-comment clickable box background animate hover-shadow">
            <div class="main box column g-2 p-3" @click="navigateTo(contextUrl)">
                <div class="row wrap g-1">
                    <Votes :target="comment" />
                    <div class="row wrap f-2 g-1">
                        <UserTag class="f-1" :user="comment.user" />
                        <Tag class="f-2" type="link" icon="fa-comment" :label="`Comment On: ${contextName}`" />
                    </div>
                    <div class="row wrap g-1">
                        <Tag v-if="comment.edited" class="meta">
                            <i class="fa-solid fa-stopwatch"></i>
                            {{ formatDate(comment.time) }}
                            <i class="fa-solid fa-eraser"></i>
                            {{ formatDate(comment.timeEdited) }}
                        </Tag>
                        <DurationTag v-else class="meta" :time="comment.time" />
                        <ModerationState :moderation="comment.moderation" content-type="comment" />
                    </div>
                </div>
                <Markdown compact class="content preview" :content="comment.content" />
            </div>
        </div>
    </ContentVisibility>
</template>

<style scoped lang="scss">
.search-comment .main {
    overflow: hidden;
}

</style>