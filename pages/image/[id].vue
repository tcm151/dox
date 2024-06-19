<script setup lang="ts">
import type { Image, User } from "~/types"

definePageMeta({
    layout: 'middle'
})

const session = getSession()

const route = useRoute()
const id = route.params.id.toString()

const { data: image, refresh } = await useAsyncData(`image:${id}`, () => {
    return $fetch<Image>(`/api/image/${id}`)
})
</script>

<template>
    <article class="px-5">
        <section class="box p-2" v-if="image">
            <header class="row-wrap g-1 mb-2">
                <ClientOnly>
                    <Votes :target="image" />
                    <UserTag class="f-1" :user="(image.user as User)" />
                    <TimeTag :time="image.time" />
                    <Tag type="info" icon="fa-image" :label="image.type" />
                    <Tag type="warning" icon="fa-cube" :label="`${image.tokens} tokens`" />
                    <Tag type="danger" icon="fa-flag" label="Report" @click="" />
                    <Tag
                        v-if="session.user.id == (image.user as User).id || hasRole(session.user, 'admin')"
                        type="danger"
                        icon="fa-trash-can"
                        label="Delete"
                        @click=""
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
        max-height: calc(100vh - 40px - 5rem);
        border-radius: 0.25rem;
        object-fit: contain;
    }
}
</style>