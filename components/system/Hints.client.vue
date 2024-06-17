<script setup lang="ts">
import type { Hint } from '~/services/hints';

const hints = useHints()

function getColor(hint: Hint) {
    switch (hint.type) {
        case "message":
            return "link inverted";
        case "success":
            return "success inverted";
        case "warning":
            return "warning inverted";
        case "error":
            return "error inverted";
    }
}
</script>

<template>
    <aside class="hints">
        <TransitionGroup name="hints">
            <div
            v-for="hint in hints.items"
            :key="hint.number"
            class="tag px-4 py-2"
            :class="getColor(hint)"
            :style="{ backgroundColor: getColor(hint) }"
            >
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

div.tag {
    position: relative;
    width: fit-content;
    max-width: 60rem;
    white-space: break-spaces;
    border-radius: 0.25rem;
    box-shadow: 0.25rem 0.25rem 1rem -0.25rem $white-3,
                0 0 0.33rem 1px $white-3;
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