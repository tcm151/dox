<script setup lang="ts">
import type { ModerationRequest } from "@@/shared/types"

const hints = useHints()

const { data: requests, refresh } = await useDatasource<ModerationRequest[]>("/api/moderator/request")

const openRequests = computed(() => {
    return requests.value?.filter(r => !r.closed) ?? []
})

const approvedRequests = computed(() => {
    return requests.value?.filter(r => r.closed && r.approvals.length > r.denials.length) ?? []
})

const deniedRequests = computed(() => {
    return requests.value?.filter(r => !r.closed && r.denials.length > r.approvals.length) ?? []
})

async function approveRequest(id: string) {
    try {
        await useApi(`/api/moderator/request/${extractId(id)}/approve`)
        hints.addSuccess("Approved moderation request.")
        await refresh()
    }
    catch (error: any) {
        hints.addError("Failed to approve moderation request.")
    }
}

async function denyRequest(id: string) {
    try {
        await useApi(`/api/moderator/request/${extractId(id)}/deny`)
        hints.addSuccess("Denied moderation request.")
        await refresh()
    }
    catch (error: any) {
        hints.addError("Failed to deny moderation request.")
    }
}
</script>

<template>
    <article class="column g-2 p-4">
        <section v-if="openRequests.length > 0" class="box column g-2 p-3">
            <div class="row g-1" v-for="request in openRequests">
                <h3>Open</h3>
                <TopicTag class="b-0" :topic="request.topic.id" />
                <UserTag class="f-max b-0" :user="request.user" />
                <Tag type="success" label="Approve" icon="fa-check" @click="approveRequest(request.id)" />
                <Tag type="danger" label="Deny" icon="fa-x" @click="denyRequest(request.id)" />
            </div>
        </section>
        <section v-if="approvedRequests.length > 0" class="box column g-2 p-3">
            <h3>Approved</h3>
            <div class="row g-1" v-for="request in approvedRequests">
                <TopicTag class="b-0" :topic="request.topic.id" />
                <UserTag class="f-max b-0" :user="request.user" />
                <Tag type="success" label="Approved" icon="fa-check" />
            </div>
        </section>
        <section v-if="deniedRequests.length > 0" class="box column g-2 p-3">
            <h3>Denied</h3>
            <div class="row g-1" v-for="request in deniedRequests">
                <TopicTag class="b-0" :topic="request.topic.id" />
                <UserTag class="f-max b-0" :user="request.user" />
                <Tag type="danger" label="Denied" icon="fa-x" />
            </div>
        </section>
        <footer v-if="!requests || requests.length == 0" class="box p-3 text center">
            <p>There aren't any moderation requests.</p>
        </footer>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width (40rem, 1rem);
}
</style>