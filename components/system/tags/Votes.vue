<script setup lang="ts">
import type { Voteable } from '~/types'

const vote = useVoting()
const session = getSession()
const settings = useSettings()

const props = defineProps<{
    target: Voteable
}>()

const voteable = computed(() => {
    return props.target
})

</script>

<template>
    <div class="fit row g-1">
        <ClientOnly>
            <span class="tag positive" @click.stop="vote.positive(voteable)"
                :class="{ voted: target.votes.positive.includes(session.user.id)}">
                {{ voteable.votes.positive.length }}
            </span>
            <span v-if="settings.app.voting.showMisleading" class="tag misleading"
                @click.stop="vote.misleading(target)"
                :class="{ voted: target.votes.misleading.includes(session.user.id)}">
                {{ target.votes.misleading.length }}
            </span>
            <span v-if="settings.app.voting.showNegative" class="tag negative"
                @click.stop="vote.negative(target)"
                :class="{ voted: target.votes.negative.includes(session.user.id)}">
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