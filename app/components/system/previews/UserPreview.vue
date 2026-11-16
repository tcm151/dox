<script setup lang="ts">
import type { User } from '@@/shared/types'

const props = defineProps<{
    user: User
}>()

const emit = defineEmits<{
    (event: 'refresh'): void
}>()

const session = getSession()
const isDeletedUser = computed(() => props.user.id === "user:deleted")
const following = computed(() => session.user?.following.includes(props.user.id))
const isOwnProfile = computed(() => props.user.id === session.user?.id)

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

</script>

<template>
    <main class="box column g-3 p-5">
        <section class="row g-2">
            <figure class="image is-64x64">
                <img class="br-small" src="https://bulma.io/assets/images/placeholders/64x64.png">
            </figure>
            <div class="name-follow row inline between f-1 g-4">
                <div>
                    <h2>{{ user.name }}</h2>
                    <a v-if="user.link" class="text truncate" :href="user.link">
                        {{ user.link }}
                    </a>
                </div>
                <Authenticated v-if="!isDeletedUser">
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
                        <TargetOptions v-if="!isOwnProfile" :target="user" :name="user.name" @refresh="emit('refresh')" />
                    </div>
                </Authenticated>
            </div>
        </section>
        <section class="row wrap g-1">
            <Votes :target="user" />
            <Tag class="f-1 fw-normal" type="info" icon="fa-crown" :label="user.votes.awards.length.toString()" />
            <Tag class="f-1 fw-normal" type="info" icon="fa-box-archive" :label="user.votes.saves.length.toString()" />
            <Tag class="f-1 fw-normal" type="link">
                <strong>{{ user.visits }}</strong> visits
            </Tag>
            <Tag class="f-1 fw-normal" type="link" @click="navigateTo(`/user/${extractId(user.id)}/topics`)">
                <strong>{{ user.topics.length }}</strong> topics
            </Tag>
            <Tag class="f-1 fw-normal" type="info" @click="navigateTo(`/user/${extractId(user.id)}/followers`)">
                <strong>{{ user.followers.length }}</strong> followers
            </Tag>
            <Tag class="f-1 fw-normal" type="info" @click="navigateTo(`/user/${extractId(user.id)}/following`)">
                <strong>{{ user.following.length }}</strong> following
            </Tag>
            <Tag class="f-1 fw-normal" type="info">
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
        font-weight: var(--fw-bold);
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

</style>