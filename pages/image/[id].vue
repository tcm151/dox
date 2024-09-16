<script setup lang="ts">
import type { Image, User } from "~/types"

definePageMeta({
    layout: 'middle'
})

const hints = useHints()
const session = getSession()

const route = useRoute()
const id = route.params.id.toString()

const { data: image } = await useAsyncData(`image:${id}`, () => {
    return $fetch<Image>(`/api/image/${id}`)
})

async function deleteImage() {
    if (!image.value) {
        hints.addWarning("This image does not exist.")
        return
    }

    await session.useApi(`/api/image/${extractId(image.value.id)}/delete`)
    hints.addSuccess(`${(image.value.user as User).name} has been refunded ${image.value.tokens} tokens.`)
}

async function reportImage() {
    if (!image.value) {
        hints.addWarning("This image does not exist.")
        return
    }

    await session.useApi(`/api/image/${extractId(image.value.id)}/report`)
    hints.addWarning("This image has been reported to the development team.")
}
</script>

<template>
    <article class="p-4">
        <section class="box p-4" v-if="image">
            <header class="row-wrap g-1 mb-2">
                <ClientOnly>
                    <Votes :target="image" />
                    <UserTag class="f-1" :user="(image.user as User)" />
                    <TimeTag :time="image.time" />
                    <Tag type="info" icon="fa-image" :label="image.type" />
                    <Tag type="warning" icon="fa-cube" :label="`${image.tokens} tokens`" />
                    <Tag type="danger" icon="fa-flag" label="Report" @click="reportImage" />
                    <Tag
                        v-if="session.user.id == (image.user as User).id || hasRole(session.user, 'admin')"
                        type="danger"
                        icon="fa-trash-can"
                        label="Delete"
                        @click="deleteImage"
                    />
                </ClientOnly>
            </header>
            <figure class="image">
                <img :src="image.url">
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
        border-radius: 0.25rem;
        object-fit: contain;
    }
}
</style>