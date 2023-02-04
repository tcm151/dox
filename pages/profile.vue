<script setup lang="ts">
const session = getSession();

interface Response {
    success: boolean
    user: {
        id: string
        name: string
    }
}

</script>


<template>
    <div class="profile column g-2 m-5 p-5" v-if="session.user">
        <ClientOnly>
            <div class="row g-2">
                <div class="image is-64x64">
                    <img src="https://bulma.io/images/placeholders/64x64.png">
                </div>
                <div class="column">
                    <h1>{{ session.user?.name }}</h1>
                    <div class="follows row g-2">
                        <div class="link">
                            <p><strong>{{ session.user.topics.length }}</strong> topics</p>
                        </div>
                        <div class="info">
                            <p><strong>{{ session.user.followers.length }}</strong> followers</p>
                        </div>
                        <div class="info">
                            <p><strong>{{ session.user.following.length }}</strong> following</p>
                        </div>
                        <div class="info">
                            <p>joined <strong>{{ formatDate(session.user.dateCreated) }}</strong></p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row g-2">
                <button class="success">Follow</button>
                <button class="danger">Block</button>
            </div>
        </ClientOnly>
    </div>
</template>

<style scoped lang="scss">
@import "~/assets/global.scss";

.profile {
    max-width: 750px;
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;
}

.image {
    flex: 0 1;

    img {
        border-radius: 0.25rem;
    }
}

.follows {
    white-space: nowrap;

    strong {
        font-weight: 800;
    }

    .info, .link {
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
    }
}

</style>