<script setup lang="ts">
interface Hint {
    number?: number
    message: string
    type: "message" | "success" | "warning" | "error"
}

const events = useEvents();
const settings = useUserSettings();
events.subscribe(Trigger.addHint, addHint);

let hintCount = ref(0);
let hints = ref<Hint[]>([])

function addHint(payload: Hint) {
    payload.number = hintCount.value += 1;
    hints.value.push(payload);
    setTimeout(() => removeHont(payload), settings.state.hintDuration);
}

function removeHont(hint: Hint) {
    hints.value = hints.value.filter(n => n.number !== hint.number)
}

function getColor(hint: Hint) {
    switch (hint.type) {
        case "message":
            return "#8783D1";
        case "success":
            return "#1FAD83";
        case "warning":
            return "#FFCF33";
        case "error":
            return "#F55D3E";
    }
}
</script>

<template>
    <aside class="hints">
        <div class="item px-4 py-2" v-for="hint in hints" :style="{ backgroundColor: getColor(hint) }">
            {{ hint.message }}
        </div>
    </aside>
</template>

<style scoped lang="scss">
.hints {
    width: 100%;
    position: absolute;
    align-items: center;
    pointer-events: none;
    isolation: isolate;
    z-index: 10000;
}

@media only screen and (max-aspect-ratio: 1/1) {
    .hints {
        top: 0;
        display: flex;
        flex-direction: column-reverse;
        gap: 0.5rem;
        margin-top: 10rem;
    }
}

@media only screen and (min-aspect-ratio: 1/1) {
    .hints {
        bottom: 0;
        @include flex-v (0.5rem);
        margin-bottom: 10rem;
    }
}

@keyframes fade-in {
    0% { opacity: 0% }
    100% { opacity: 100% }
}

.item {
    position: relative;
    @include flex-h;
    width: fit-content;
    max-width: 512px;
    font-weight: 600;
    text-align: center;
    border-radius: 0.25rem;
    box-shadow: 0.25rem 0.25rem 1rem -0.25rem $dox-white-dark,
                0 0 0.33rem 1px $dox-white-dark;
    animation: fade-in 256ms;
    pointer-events: all;
}
</style>