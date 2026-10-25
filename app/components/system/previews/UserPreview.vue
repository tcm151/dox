<script setup lang="ts">
import type { User } from '@@/shared/types'

const props = defineProps<{
    user: User
}>()

const emit = defineEmits<{
    (event: 'refresh'): void
}>()

const session = getSession()
const following = computed(() => session.user?.following.includes(props.user.id))
const isOwnProfile = computed(() => props.user.id === session.user?.id)
const saved = ref<boolean>(false)
const awarded = ref<boolean>(false)
const saveCount = ref<number>(0)
const awardCount = ref<number>(0)

const engagement = computed(() => ({
    votes: props.user.votes,
    viewerId: session.user?.id,
}))

watch(
    engagement,
    ({ votes, viewerId }) => {
        saveCount.value = votes.saves.length
        awardCount.value = votes.awards.length
        saved.value = viewerId ? votes.saves.includes(viewerId) : false
        awarded.value = viewerId ? votes.awards.includes(viewerId) : false
    },
    { immediate: true },
)

const connections = useFollowing()
const loading = ref<boolean>(false)

async function followUser() {
    loading.value = true
    try {
        if (await connections.follow(props.user.id)) {
            emit('refresh')
        }
    }
    finally {
        loading.value = false
    }
}

async function unfollowUser() {
    loading.value = true
    try {
        if (await connections.unfollow(props.user.id)) {
            emit('refresh')
        }
    }
    finally {
        loading.value = false
    }
}

const hints = useHints()

async function toggleSaved() {
    const wasSaved = saved.value
    loading.value = true
    try {
        await useApi(`/api/user/${extractId(props.user.id)}/${wasSaved ? "unsave" : "save"}`)
        saved.value = !wasSaved
        saveCount.value += wasSaved ? -1 : 1
        hints.addSuccess(wasSaved ? "User removed from saved subscriptions." : "User saved as a subscription.")
        emit("refresh")
    }
    catch {
        hints.addError("Unable to update this saved subscription.")
    }
    finally {
        loading.value = false
    }
}

const events = useEvents()

function awardUser() {
    if (awarded.value) {
        hints.addWarning("You have already awarded this user.")
        return
    }
    if (session.user.tokens < 256) {
        hints.addWarning("You do not have enough tokens to award this user.")
        return
    }

    events.publish(Trigger.showPopup, {
        title: "Confirm Award",
        message: "Are you sure you want to award this user? It will cost 256 tokens.",
        accept: async () => {
            loading.value = true
            try {
                await useApi(`/api/user/${extractId(props.user.id)}/award`)
                awarded.value = true
                awardCount.value += 1
                await session.refreshProfile()
                hints.addSuccess("Successfully awarded user.")
                emit("refresh")
            }
            catch {
                hints.addError("Unable to award this user.")
            }
            finally {
                loading.value = false
            }
        },
    })
}

</script>

<template>
    <main class="box column g-3 p-5">
        <section class="row g-2">
            <figure class="image is-64x64">
                <img src="https://bulma.io/assets/images/placeholders/64x64.png">
            </figure>
            <div class="name-follow row inline between f-1 g-4">
                <div>
                    <h2>{{ user.name }}</h2>
                    <a v-if="user.link" class="text truncate" :href="user.link">
                        {{ user.link }}
                    </a>
                </div>
                <Authenticated>
                    <div class="row wrap g-2">
                        <button v-if="isOwnProfile" class="small" @click="navigateTo('/settings')">
                            <i class="fa-solid fa-address-card"></i>
                            <span>Profile</span>
                        </button>
                        <ButtonSpinner v-else-if="following" class="danger small" :loading="loading" @click="unfollowUser">
                            Unfollow
                        </ButtonSpinner>
                        <ButtonSpinner v-else class="success small" :loading="loading" @click="followUser">
                            Follow
                        </ButtonSpinner>
                        <ButtonSpinner v-if="!isOwnProfile" class="link small" :loading="loading" @click="toggleSaved">
                            <i :class="saved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'"></i>
                            <span>{{ saved ? "Saved" : "Save" }}</span>
                        </ButtonSpinner>
                        <ButtonSpinner v-if="!isOwnProfile" class="warning small" :loading="loading" :disabled="awarded" @click="awardUser">
                            <i class="fa-solid fa-crown"></i>
                            <span>{{ awarded ? "Awarded" : "Award" }}</span>
                        </ButtonSpinner>
                    </div>
                </Authenticated>
            </div>
        </section>
        <section class="row wrap g-1">
            <Votes :target="user" />
            <Tag class="f-1" type="info" icon="fa-crown" :label="awardCount.toString()" />
            <Tag class="f-1" type="info" icon="fa-box-archive" :label="saveCount.toString()" />
            <Tag class="f-1" type="link">
                <strong>{{ user.visits }}</strong> visits
            </Tag>
            <Tag class="f-1" type="link" @click="navigateTo(`/user/${extractId(user.id)}/topics`)">
                <strong>{{ user.topics.length }}</strong> topics
            </Tag>
            <Tag class="f-1" type="info" @click="navigateTo(`/user/${extractId(user.id)}/followers`)">
                <strong>{{ user.followers.length }}</strong> followers
            </Tag>
            <Tag class="f-1" type="info" @click="navigateTo(`/user/${extractId(user.id)}/following`)">
                <strong>{{ user.following.length }}</strong> following
            </Tag>
            <Tag class="f-1" type="info">
                joined <strong>{{ formatDate(user.dateJoined ?? "") }}</strong> ago
            </Tag>
        </section>
        <section v-if="user.description" class="column g-2">
            <p>{{ user.description }}</p>
        </section>
    </main>
</template>

<style scoped lang="scss">
.name-follow {
    overflow-x: hidden;

    a {
        color: $purple;
        font-weight: 600;
    }

    a:hover {
        text-decoration: underline;
    }
}

div.buttons {
    @media (max-width: $bp-tablet) {
        span {
            display: none;
        }
    }

    button {
        min-width: 6rem;
    }
}

.image {
    img {
        border-radius: 0.25rem;
    }
}

.tag.info, .tag.link {
    font-weight: 500;
}
</style>