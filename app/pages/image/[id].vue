<script setup lang="ts">
import type { Image } from "@@/shared/types"

definePageMeta({
    layout: 'middle'
})

const hints = useHints()
const session = getSession()

const route = useRoute()
const id = route.params.id?.toString()

const { data: image } = await useDatasource<Image>(`/api/image/${id}`)

async function deleteImage() {
    if (!image.value) {
        hints.addWarning("This image does not exist.")
        return
    }

    await useApi(`/api/image/${extractId(image.value.id)}/delete`)
    hints.addSuccess(`${image.value.user.name} has been refunded ${image.value.tokens} tokens.`)
}

async function reportImage() {
    if (!image.value) {
        hints.addWarning("This image does not exist.")
        return
    }

    submitReport(image.value.id)
}
</script>

<template v-if="id">
    <article class="p-4">
        <section v-if="image" class="box column g-2 p-4">
            <ContentHeader :content="image">
                <template #actions>
                    <Tag type="danger" icon="fa-flag" label="Report" @click="reportImage" />
                    <ClientOnly>
                        <Tag
                            v-if="session.user.id == image.user.id || hasRole(session.user, 'admin')"
                            type="danger"
                            icon="fa-trash-can"
                            label="Delete"
                            @click="deleteImage"
                        />
                    </ClientOnly>
                </template>
            </ContentHeader>
            <Markdown v-if="image.description" compact class="content" :content="image.description" />
            <figure class="image">
                <img class="br-small" :src="image.url">
            </figure>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    max-width: 120rem;
}

figure {
    img {
        height: 100%;
        max-height: calc(100vh - 40px - 6rem);
        object-fit: contain;
    }
}
</style>