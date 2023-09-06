<script setup lang="ts">
import { Hint } from '~/services/hints';

const hints = useHints()

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
        <TransitionGroup name="hints">
            <div class="item px-4 py-2" v-for="hint in hints.items" :key="hint.number" :style="{ backgroundColor: getColor(hint) }">
                {{ hint.message }}
            </div>
        </TransitionGroup>
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

// @keyframes fade-in {
//     0% { opacity: 0% }
//     100% { opacity: 100% }
// }

.item {
    position: relative;
    @include flex-h;
    width: fit-content;
    max-width: 512px;
    font-weight: 600;
    text-align: center;
    border-radius: 0.25rem;
    box-shadow: 0.25rem 0.25rem 1rem -0.25rem $dox-white-3,
                0 0 0.33rem 1px $dox-white-3;
    // animation: fade-in 256ms;
    pointer-events: all;
}

.hints-move, .hints-enter-active, .hints-leave-active {
    transition: all 128ms ease;
}

.hints-enter-from {
    @media only screen and (max-aspect-ratio: 1/1) {
        transform: translateY(-200%);
    }
    
    @media only screen and (min-aspect-ratio: 1/1) {
        transform: translateY(200%);
    }
}

.hints-enter-from, .hints-leave-to {
    opacity: 0;
}
</style>