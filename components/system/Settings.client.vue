<script setup lang="ts">

const props = defineProps<{
    visible: boolean
}>()

const emit = defineEmits<{
    (event: 'close'): void
}>()

const hints = useHints()
const session = getSession()
const settings = useUserSettings()

async function sendConfirmation() {
    await session.useApi("/api/profile/confirm/send")
    hints.addSuccess("Confirmation sent!")
    await new Promise(resolve => setTimeout(resolve, 1024));
    hints.addError("Expires in 15 minutes...")
}
</script>


<template>
    <!-- TODO add support for users to change their passwords -->
    <!-- TODO add two-factor authentication -->
    <Window
        :visible="visible"
        title="Settings"
        icon="fa-solid fa-gear"
        @close="emit('close')"
    >
        <div class="form">
            <div class="row g-2">
                <button class="fill danger" @click="sendConfirmation" v-if="!session.user.confirmed">Confirm Account</button>
                <button class="fill success" v-else>Account Confirmed</button>
            </div>
            <div class="row-fit g-2">
                <input type="checkbox" v-model="settings.state.hoverAnimations">
                <label>enable animations</label>
            </div>
            <div class="field row-fit">
                <label>hint duration (ms)</label>
                <input type="number" size="4" step="250" v-model="settings.state.hintDuration">
            </div>
            <div class="tokens field row-fit">
                <label>
                    <span>Tokens</span>
                    <i class="fa-solid fa-cube"></i>
                </label>
                <input disabled v-model="session.user.tokens">
            </div>
        </div>
    </Window>
</template>

<style scoped lang="scss">
div.tokens {
    input {
        user-select: none;
    }
}

label:has(span, i) {
    @include flex-h (0.33rem);
    align-items: center;

    i.fa-cube {
        color: $dox-yellow;
    }
}
</style>