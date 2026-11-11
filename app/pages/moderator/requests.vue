<script setup lang="ts">
import type { ModerationRequest } from "@@/shared/types"

const hints = useHints()
const session = getSession()

const { data: requests, pending, refresh } = await useAuthenticatedDatasource<ModerationRequest[]>("/api/moderator/request")

const openRequests = computed(() => {
    return requests.value?.filter(r => !r.closed) ?? []
})

const approvedRequests = computed(() => {
    return requests.value?.filter(r => r.closed && r.approvals.length > r.denials.length) ?? []
})

const deniedRequests = computed(() => {
    return requests.value?.filter(r => r.closed && r.denials.length > r.approvals.length) ?? []
})

type RequestStatus = "open" | "approved" | "denied"

const requestStages: { status: RequestStatus, label: string, type: string }[] = [
    { status: "open", label: "Open", type: "danger" },
    { status: "approved", label: "Approved", type: "success" },
    { status: "denied", label: "Denied", type: "danger" },
]

const selectedStatus = ref<RequestStatus | undefined>("open")
const requestsByStatus = computed(() => ({
    open: openRequests.value,
    approved: approvedRequests.value,
    denied: deniedRequests.value,
}))

const filteredRequests = computed(() => {
    if (selectedStatus.value) return requestsByStatus.value[selectedStatus.value]
    return [...openRequests.value, ...approvedRequests.value, ...deniedRequests.value]
})

function countRequests(status: RequestStatus) {
    return requestsByStatus.value[status].length
}

function toggleStatus(status: RequestStatus) {
    selectedStatus.value = selectedStatus.value === status ? undefined : status
}

function requestStatus(request: ModerationRequest): RequestStatus {
    if (!request.closed) return "open"
    return request.approvals.length > request.denials.length ? "approved" : "denied"
}

function requestStage(request: ModerationRequest) {
    return requestStages.find(stage => stage.status === requestStatus(request))!
}

async function approveRequest(id: string) {
    try {
        await useApi(`/api/moderator/request/${extractId(id)}/approve`)
        hints.addSuccess("Approved moderation request.")
        await refresh()
    }
    catch (error: any) {
        hints.addError("Failed to approve moderation request.", error)
    }
}

async function denyRequest(id: string) {
    try {
        await useApi(`/api/moderator/request/${extractId(id)}/deny`)
        hints.addSuccess("Denied moderation request.")
        await refresh()
    }
    catch (error: any) {
        hints.addError("Failed to deny moderation request.", error)
    }
}
</script>

<template>
    <article class="content-width column g-2 p-4">
        <header class="row wrap inline between g-2">
            <h1>Requests</h1>
            <ButtonSpinner class="dark" :loading="pending" @click="refresh()">
                <i class="fa-solid fa-rotate"></i>
                <span>Refresh</span>
            </ButtonSpinner>
        </header>
        <nav class="row wrap g-2">
            <template v-for="stage in requestStages" :key="stage.status">
                <button type="button" class="f-1 b-0" :class="{ selected: selectedStatus === stage.status }" @click="toggleStatus(stage.status)">
                    <span>{{ stage.label }}</span>
                    <span>{{ countRequests(stage.status) }}</span>
                </button>
            </template>
        </nav>
        <section v-if="filteredRequests.length > 0" class="box column g-2 p-3">
            <template v-for="request in filteredRequests" :key="request.id">
                <article class="row wrap inline g-1">
                    <Tag class="f-1 b-0" :type="requestStage(request).type" :label="requestStage(request).label" />
                    <TopicTag class="f-1 b-0" :topic="request.topic.id" />
                    <UserTag class="f-1 b-0" :user="request.user" />
                    <template v-if="!request.closed">
                        <Tag v-if="request.user.id !== session.user.id || hasRole(session.user, 'admin')" type="success" label="Approve" icon="fa-check" @click="approveRequest(request.id)" />
                        <Tag v-if="request.user.id !== session.user.id" type="danger" label="Deny" icon="fa-x" @click="denyRequest(request.id)" />
                    </template>
                </article>
            </template>
        </section>
        <section v-else class="box empty-state" aria-live="polite">
            <p v-if="requests && requests.length > 0">There are no requests in this stage.</p>
            <p v-else>There aren't any moderation requests.</p>
        </section>
    </article>
</template>