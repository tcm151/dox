<script setup lang="ts">
import type { Voteable } from '@@/shared/types'

const vote = useVoting()
const session = getSession()
const settings = useSettings()

const props = defineProps<{
    target: Pick<Voteable, "id" | "votes">
}>()

type VoteType = "positive" | "misleading" | "negative"
const voteAnimationKey = reactive<Record<VoteType, number>>({
    positive: 0,
    misleading: 0,
    negative: 0,
})
const voteAnimationActive = reactive<Record<VoteType, boolean>>({
    positive: false,
    misleading: false,
    negative: false,
})

function handleVote(type: VoteType) {
    if (session.isAuthenticated && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        voteAnimationActive[type] = true
        voteAnimationKey[type]++
    }

    void vote[type](props.target)
}

function clearVoteStateChange(type: VoteType) {
    voteAnimationActive[type] = false
}

</script>

<template>
    <div v-if="settings.app.voting.enabled" class="row g-1">
        <ClientOnly>
            <Tag
                :key="voteAnimationKey.positive"
                type="positive"
                width="2rem"
                :class="{ voted: target.votes.positive.includes(session.user.id), 'vote-state-change': voteAnimationActive.positive }"
                @click.stop="handleVote('positive')"
                @animationend="clearVoteStateChange('positive')"
            >
                {{ target.votes.positive.length }}
            </Tag>
            <Tag v-if="settings.app.voting.misleading"
                :key="voteAnimationKey.misleading"
                type="misleading"
                width="2rem"
                :class="{ voted: target.votes.misleading.includes(session.user.id), 'vote-state-change': voteAnimationActive.misleading }"
                @click.stop="handleVote('misleading')"
                @animationend="clearVoteStateChange('misleading')"
            >
                {{ target.votes.misleading.length }}
            </Tag>
            <Tag v-if="settings.app.voting.negative"
                :key="voteAnimationKey.negative"
                type="negative"
                width="2rem"
                :class="{ voted: target.votes.negative.includes(session.user.id), 'vote-state-change': voteAnimationActive.negative }"
                @click.stop="handleVote('negative')"
                @animationend="clearVoteStateChange('negative')"
            >
                {{ target.votes.negative.length }}
            </Tag>
        </ClientOnly>
    </div>
</template>