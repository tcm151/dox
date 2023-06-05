<script setup lang="ts">
import { TokenTextSplitter, MarkdownTextSplitter } from "langchain/text_splitter"


const hints = useHints()

const { post, comments } = usePost('hql980m4nu32ynbb4ev1')
await post.fetch()

const splitter = new MarkdownTextSplitter({
    chunkSize: 1024,
    chunkOverlap: 256,
})

const splits = await splitter.splitText(post.value!.content)

// TODO implement knowledge search
async function searchKnowledge() {
    hints.addWarning("Search has not been implemented yet.")
}
</script>

<template>
    <article class="p-4">
        <section class="search-bar row g-2 p-4">
            <div class="field fill">
                <input type="search" placeholder="Search for anything..." @keyup.enter="searchKnowledge">
            </div>
            <button @click="searchKnowledge">
                <i class="fa-solid fa-magnifying-glass"></i>
            </button>
        </section>
        <section>
            <Codeblock
                    :wrap="true" 
                    language="json"
                    :code="JSON.stringify(splits, undefined, 4)" 
                />
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(800px, 1rem);
}

section.search-bar {
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;
}
</style>