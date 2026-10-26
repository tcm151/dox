<script setup lang="ts">
import type { Gallery } from "@@/shared/types"

definePageMeta({
    layout: "middle",
})

const route = useRoute()
const hints = useHints()
const events = useEvents()
const session = getSession()
const id = route.params.id?.toString()

await useDatasource(`/api/gallery/${id}/visit`)
const { data: gallery, refresh } = await useDatasource<Gallery>(`/api/gallery/${id}`)

useSeoMeta({
    ogType: "article",
    title: () => gallery.value?.description.slice(0, 80) || "Gallery",
    ogTitle: () => gallery.value?.description.slice(0, 80) || "Gallery",
    author: () => gallery.value?.user.name || "unknown",
    description: () => gallery.value?.description.slice(0, 256),
    ogDescription: () => gallery.value?.description.slice(0, 256),
    ogImage: () => gallery.value?.images[0]?.url ?? "",
})

async function reportGallery() {
    if (!gallery.value) return
    submitReport(gallery.value.id)
}

async function archiveGallery() {
    if (!gallery.value) return
    await useApi(`/api/gallery/${extractId(gallery.value.id)}/archive`)
    hints.addSuccess(gallery.value.archived ? "Gallery unarchived." : "Gallery archived.")
    await refresh()
}

function deleteGallery() {
    if (!gallery.value) return
    const galleryId = extractId(gallery.value.id)

    events.publish(Trigger.showPopup, {
        title: "Confirm Deletion",
        message: "Are you sure you want to delete your gallery?",
        accept: async () => {
            await useApi(`/api/gallery/${galleryId}/delete`)
            hints.addSuccess("Successfully deleted gallery.")
            return navigateTo("/feed")
        },
    })
}
</script>

<template>
    <article class="p-4">
        <section v-if="gallery" class="box p-4">
            <header class="row wrap g-1 mb-3">
                <Votes :target="gallery" />
                <UserTag class="f-1" :user="gallery.user" />
                <DurationTag :time="gallery.time" />
                <Tag type="info" icon="fa-image" :label="`${gallery.images.length} images`" />
                <Tag type="info" icon="fa-chart-simple" :label="gallery.visits" />
                <Tag type="danger" icon="fa-flag" label="Report" @click="reportGallery" />
                <ClientOnly>
                    <Tag
                        v-if="session.isAuthenticated && (gallery.user.id === session.user.id || hasRole(session.user, 'admin'))"
                        type="danger"
                        icon="fa-trash-can"
                        label="Delete"
                        @click="deleteGallery"
                    />
                    <Tag
                        v-if="hasRole(session.user, 'admin') || hasRole(session.user, 'developer')"
                        type="warning"
                        :icon="gallery.archived ? 'fa-box-open' : 'fa-box-archive'"
                        :label="gallery.archived ? 'Unarchive' : 'Archive'"
                        @click="archiveGallery"
                    />
                </ClientOnly>
            </header>
            <div v-if="gallery.topics.length > 0" class="row wrap g-1 mb-3">
                <TopicTag v-for="topic in gallery.topics" :key="topic" :topic="topic" />
            </div>
            <Markdown v-if="gallery.description" class="content mb-3" :content="gallery.description" />
            <div class="gallery-images">
                <img v-for="image in gallery.images" :key="image.id" :src="image.url">
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    max-width: 120rem;
}

.gallery-images {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(18rem, 100%), 1fr));
    gap: 0.75rem;

    img {
        width: 100%;
        aspect-ratio: 4 / 3;
        border-radius: 0.25rem;
        background-color: $white-1;
        object-fit: contain;
    }
}
</style>