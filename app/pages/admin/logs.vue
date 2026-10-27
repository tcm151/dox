<script setup lang="ts">
import type { ModeratorLog } from "@@/shared/types"

const { data: logs, pending, refresh } = await useDatasource<ModeratorLog[]>("/api/admin/logs/moderator")
const expanded = ref<string[]>([])

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
            <h1>Moderation</h1>
            <button class="dark" :disabled="pending" @click="refresh()">
                <i class="fa-solid fa-rotate"></i>
                <span>Refresh</span>
            </button>
        </header>
        <template v-if="logs?.length">
            <section class="box column g-2 p-2">
                <div v-for="log in logs" :key="log.id" class="column g-1">
                    <div class="row wrap g-1">
                        <Tag type="danger f-1" :label="log.action" @click="toggle(log.id)" />
                        <Tag class="link f-1" :label="log.target" />
                        <UserTag :user="log.actor" />
                        <DurationTag :time="log.time" />
                    </div>
                    <CollapseTransition>
                        <template v-if="expanded.includes(log.id)" class="column g-2">
                            <Codeblock language="json" :code="JSON.stringify(log.details, undefined, 4)" />
                        </template>
                    </CollapseTransition>
                </div>
            </section>
        </template>
        <section v-else class="box empty-state">
            <p>No moderation activity has been recorded.</p>
        </section>
    </article>
</template>
