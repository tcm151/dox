<script setup lang="ts">
interface Hint {
    number?: number
    message: string
    type: "message" | "success" | "warning" | "error"
}

const events = useEvents();
events.subscribe("addHint", addHint);

let hintCount = ref(0);
let hints = ref<Hint[]>([])

function addHint(payload: Hint) {
    payload.number = hintCount.value += 1;
    hints.value.push(payload);
    setTimeout(() => removeHont(payload), 2048);
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
    <div class="hints">
        <div class="list">
            <div class="item" v-for="hint in hints" :style="{ backgroundColor: getColor(hint) }">
                <div class="message">{{ hint.message }}</div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.hints {
    bottom: 0;
    width: 100%;
    position: absolute;
    margin-bottom: 10rem;
    pointer-events: none;
}

.list {
    @include flex-v (0.5rem);
    align-items: center;
}

@keyframes fade-in {
    0% { opacity: 0% }
    100% { opacity: 100% }
}

.item {
    @include flex-h;
    align-items: center;
    width: fit-content;
    max-width: 512px;
    position: relative;
    font-weight: 600;
    border-radius: 0.25rem;
    box-shadow: 0.25rem 0.25rem 1rem -0.25rem $dox-white-dark, 0 0 0.33rem 1px $dox-white-dark;
    animation: fade-in 256ms;
    pointer-events: all;
    
    .message {
        flex: 1 1;
        padding: 0.5rem 1rem;
        text-align: right;
    }
}
</style>