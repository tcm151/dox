<script setup lang="ts">
import type { Comment, Gallery } from "@@/shared/types"
import CommentSection from "../post/components/CommentSection.vue"
import { useSlowMode } from "@@/app/utils/slow"

const route = useRoute()
const cache = useCache()
const hints = useHints()
const events = useEvents()
const session = getSession()
const slowMode = useSlowMode()
const id = route.params.id?.toString()

await useDatasource(`/api/gallery/${id}/visit`)
const sortBy = cache.get<string>("comments.sort", () => "new")
const { data: gallery, status, refresh } = await useDatasource<Gallery>(`/api/gallery/${id}`, {
    query: { sortBy },
})

const commentState = slowMode.submissionState(() => gallery.value)

async function refreshGallery(sortType: string) {
    if (sortType == sortBy.value) {
        await refresh()
    }
    sortBy.value = sortType
}

const showCommentBox = ref(false)
const showOptions = ref(false)
const comment = ref("")
const submitting = ref(false)

function toggleCommentBox() {
    if (!showCommentBox.value && commentState.value.disabled) return
    showCommentBox.value = !showCommentBox.value
    if (!showCommentBox.value) {
        comment.value = ""
    }
}

async function submitComment(replyTo: Gallery | Comment, content: string) {
    if (submitting.value) return
    if (!session.isAuthenticated) {
        hints.addWarning("You must be logged in to interact with others.")
        return
    }
    if (commentState.value.disabled) {
        if (commentState.value.warning) hints.addWarning(commentState.value.warning)
        return
    }

    submitting.value = true
    try {
        await useApi<Comment>("/api/comment/add", {
            body: {
                context: gallery.value?.id,
                replyTo: replyTo.id,
                content,
            },
        })
        if (gallery.value) slowMode.recordSubmission(gallery.value.id)
        comment.value = ""
        showCommentBox.value = false
        await refresh()
    }
    catch (error: any) {
        const status = error?.statusCode ?? error?.response?.status
        if (status === 409 || status === 429) hints.addWarning(error.message)
        else hints.addError(error.message, error)
    }
    finally {
        submitting.value = false
    }
}

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
    hints.addSuccess(gallery.value.status === "archived" ? "Gallery unarchived." : "Gallery archived.")
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

function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    hints.addSuccess("Copied gallery URL")
}
</script>

<template>
    <article v-if="gallery" class="column inline g-2 p-2">
        <main class="gallery box column p-4">
            <ContentHeader class="header" :content="gallery" context="detail" />
            <ContentVisibility class="column f-1" :tags="gallery.tags" direct>
                <section class="mosaic grid mt-3" :class="{
                    single: gallery.images.length === 1,
                    pair: gallery.images.length === 2,
                    trio: gallery.images.length === 3,
                }">
                    <figure v-for="(image, index) in gallery.images" :key="image.id" class="tile m-0">
                        <img
                            class="br-small"
                            :src="image.url"
                            :alt="`${gallery.description || 'Gallery'} image ${index + 1}`"
                            :loading="index === 0 ? 'eager' : 'lazy'"
                            decoding="async"
                        >
                    </figure>
                </section>
                <Markdown v-if="gallery.description" class="content" :content="gallery.description" />
            </ContentVisibility>
            <footer class="actions">
                <div class="column g-2">
                    <div class="interactions row wrap g-1">
                        <button class="comment f-1" :disabled="commentState.disabled" @click="toggleCommentBox">
                            <i class="fa-solid fa-comment"></i>
                            <span>Comment</span>
                        </button>
                        <button class="share f-1" @click="copyLink">
                            <i class="fa-solid fa-copy"></i>
                            <span>Share</span>
                        </button>
                        <ClientOnly>
                            <button class="options" @click="showOptions = !showOptions">
                                <i class="fa-solid fa-ellipsis"></i>
                            </button>
                            <OverlayTransition>
                                <ExtraOptions
                                    v-if="showOptions"
                                    :target="gallery"
                                    @updated="refresh"
                                    @report="reportGallery"
                                    @delete="deleteGallery"
                                    @archive="archiveGallery"
                                    @close="showOptions = false"
                                />
                            </OverlayTransition>
                        </ClientOnly>
                    </div>
                    <p v-if="!showCommentBox && commentState.warning" class="warning br-small px-3 py-2" role="status">{{ commentState.warning }}</p>
                    <CollapseTransition>
                        <div v-if="showCommentBox" class="field">
                            <textarea v-model="comment" rows="5"></textarea>
                            <p v-if="commentState.warning" class="warning mt-2" role="status">{{ commentState.warning }}</p>
                            <div class="row g-2 mt-2">
                                <ButtonSpinner class="success f-1" :loading="submitting" :disabled="commentState.disabled" @click="submitComment(gallery, comment)">
                                    <i class="fa-solid fa-comment"></i>
                                    <span>Submit</span>
                                </ButtonSpinner>
                                <button class="danger" @click="toggleCommentBox">
                                    <i class="fa-solid fa-ban"></i>
                                    <span>Cancel</span>
                                </button>
                            </div>
                        </div>
                    </CollapseTransition>
                </div>
            </footer>
        </main>
        <ContentVisibility v-if="gallery.comments.length > 0" :tags="gallery.tags" direct>
            <CommentSection class="content-width" :target="gallery" :sort-type="sortBy" :loading="status" @refresh="refreshGallery" />
        </ContentVisibility>
</article>
    <article v-else class="content-width column p-4">
        <footer class="box text center p-4">
            There is nothing here.
        </footer>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(120rem, 0.5rem);
}
.gallery {
    flex: 1 0 calc(100vh - 40px - 1rem);
    width: 100%;
    overflow: hidden;

    .mosaic {
        flex: 1 1 auto;
        min-height: 0;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        grid-auto-rows: minmax(0, 1fr);
        grid-auto-flow: dense;
        gap: 2px;

        &:not(.single, .pair, .trio) {
            .tile {
                grid-column: span 2;
                grid-row: span 1;
            }

            .tile:nth-child(6n + 1) {
                grid-row: span 2;
            }

            .tile:nth-child(6n + 2),
            .tile:nth-child(6n + 3) {
                grid-column: span 1;
            }
        }

        &.single {
            grid-template-columns: minmax(0, 1fr);
            grid-auto-rows: minmax(0, 1fr);

            .tile {
                aspect-ratio: auto;
            }
        }

        &.pair {
            .tile {
                grid-column: span 2;
                grid-row: span 2;
            }
        }

        &.trio {
            .tile:first-child {
                grid-column: span 2;
                grid-row: span 2;
            }

            .tile:not(:first-child) {
                grid-column: span 2;
                grid-row: span 1;
            }
        }
    }

    .tile {
        min-width: 0;
        overflow: hidden;
        background-color: $white-1;

        img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }

    @media (max-width: $bp-tablet) {
        .mosaic {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-auto-rows: minmax(0, 1fr);

            &:not(.single, .pair, .trio) {
                .tile {
                    grid-column: span 1;
                }

                .tile:nth-child(6n + 1) {
                    grid-column: span 2;
                    grid-row: span 2;
                }

                .tile:nth-child(6n + 4) {
                    grid-column: span 2;
                }
            }

            &.pair {
                .tile {
                    grid-column: span 1;
                    grid-row: span 2;
                }
            }

            &.trio {
                .tile:first-child {
                    grid-column: span 2;
                    grid-row: span 2;
                }

                .tile:not(:first-child) {
                    grid-column: span 1;
                    grid-row: span 1;
                }
            }
        }
    }
}
</style>