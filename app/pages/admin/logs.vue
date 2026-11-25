<script setup lang="ts">
import type { ModeratorLog } from "@@/shared/types"

const { data: logs, pending, refresh } = await useAuthenticatedDatasource<ModeratorLog[]>("/api/admin/logs/moderator")
const expanded = ref<string[]>([])

function actionLabel(action: string) {
    if (action === "moderation_request.approved") return "moderation.request.approved"
    if (action === "moderation_request.denied") return "moderation.request.denied"
    return action
}

function toggle(id: string) {
    if (expanded.value.includes(id)) {
        expanded.value = expanded.value.filter(value => value !== id)
    }
    else {
        expanded.value.push(id)
    }
}
</script>

<template>
    <article class="content-width column g-2 p-4">
        <header class="row wrap inline between g-2">
            <h1>Moderation Logs</h1>
            <ButtonSpinner class="dark" :loading="pending" @click="refresh()">
                <i class="fa-solid fa-rotate"></i>
                <span>Refresh</span>
            </ButtonSpinner>
        </header>
        <template v-if="logs?.length">
            <section class="box column g-2 p-2">
                <template v-for="log in logs" :key="log.id">
                    <article class="column g-1">
                        <div class="row wrap g-1">
                            <Tag type="danger f-2 b-0" :label="actionLabel(log.action)" @click="toggle(log.id)" />
                            <Tag class="link f-2 b-0" :label="log.target" />
                            <UserTag class="f-1 b-0" :user="log.actor" />
                            <DurationTag width="4rem" :time="log.time" />
                        </div>
                        <CollapseTransition>
                            <template v-if="expanded.includes(log.id)" class="column g-2">
                                <Codeblock language="json" :code="JSON.stringify(log.details, undefined, 4)" />
                            </template>
                        </CollapseTransition>
                    </article>
                </template>
            </section>
        </template>
        <section v-else-if="logs" class="box empty-state" aria-live="polite">
            <p>No moderation activity has been recorded.</p>
        </section>
    </article>
</template>
