<script setup lang="ts">
import type { Voteable } from '@@/shared/types'

const vote = useVoting()
const session = getSession()
const settings = useSettings()

const props = defineProps<{
    target: Voteable
}>()

</script>

<template>
    <div v-if="settings.app.voting.enabled" class="fit row g-1">
        <ClientOnly>
            <Tag
                type="positive"
                width="2rem"
                :class="{ voted: target.votes.positive.includes(session.user.id)}"
                @click.stop="vote.positive(target)"
            >
                {{ target.votes.positive.length }}
            </Tag>
            <Tag v-if="settings.app.voting.misleading"
                type="misleading"
                width="2rem"
                :class="{ voted: target.votes.misleading.includes(session.user.id)}"
                @click.stop="vote.misleading(target)"
            >
                {{ target.votes.misleading.length }}
            </Tag>
            <Tag v-if="settings.app.voting.negative"
                type="negative"
                width="2rem"
                :class="{ voted: target.votes.negative.includes(session.user.id)}"
                @click.stop="vote.negative(target)"
            >
                {{ target.votes.negative.length }}
            </Tag>
        </ClientOnly>
    </div>
</template>