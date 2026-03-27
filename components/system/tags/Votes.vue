<script setup lang="ts">
import type { Voteable } from '~/types'

const vote = useVoting()
const session = getSession()
const settings = useSettings()

const props = defineProps<{
    target: Voteable
}>()

</script>

<template>
    <div class="fit row g-1">
        <ClientOnly>
            <span
                class="tag positive"
                :class="{ voted: target.votes.positive.includes(session.user.id)}"
                @click.stop="vote.positive(target)"
            >
                {{ target.votes.positive.length }}
            </span>
            <span v-if="settings.app.voting.showMisleading"
                class="tag misleading"
                :class="{ voted: target.votes.misleading.includes(session.user.id)}"
                @click.stop="vote.misleading(target)"
            >
                {{ target.votes.misleading.length }}
            </span>
            <span v-if="settings.app.voting.showNegative"
                class="tag negative"
                :class="{ voted: target.votes.negative.includes(session.user.id)}"
                @click.stop="vote.negative(target)"
            >
                {{ target.votes.negative.length }}
            </span>
        </ClientOnly>
    </div>
</template>

<style scoped lang="scss">
span:is(.positive, .misleading, .negative) {
    width: 2rem;
    user-select: none;
}
</style>