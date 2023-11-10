<script setup lang="ts">
import type { Voteable } from '~/types'

const vote = useVoting()
const session = getSession()

const props = defineProps<{
    target: Voteable | null
}>()

</script>

<template>
    <div class="fit row g-1" v-if="target">
        <span class="tag positive" @click="vote.positive(target)" :class="{ voted: target.votes.positive.includes(session.user.id)}">
            {{ target.votes.positive.length }}
        </span>
        <span class="tag misleading" @click="vote.misleading(target)" :class="{ voted: target.votes.misleading.includes(session.user.id)}">
            {{ target.votes.misleading.length }}
        </span>
        <span class="tag negative" @click="vote.negative(target)" :class="{ voted: target.votes.negative.includes(session.user.id)}">
            {{ target.votes.negative.length }}
        </span>
        <span class="tag link" v-if="target.votes.awards && target.votes.awards.length > 0">
            <i class="fa-solid fa-crown"></i>
            <span>{{ target.votes.awards.length }}</span>
        </span>
        <span class="tag link" v-if="target.votes.saves && target.votes.saves.length > 0">
            <i class="fa-solid fa-box-archive"></i>
            <span>{{ target.votes.saves.length }}</span>
        </span>
    </div>
</template>

<style scoped lang="scss">
span:is(.positive, .misleading, .negative) {
    width: 0.5rem;
    user-select: none;
}
</style>