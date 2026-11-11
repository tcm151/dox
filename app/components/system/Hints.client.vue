<script setup lang="ts">
const hints = useHints()
const session = getSession()
const route = useRoute()

watch(() => [route.path, route.query.requestId] as const, ([path, requestId]) => {
    if (path !== "/developer/errors" || typeof requestId !== "string") return

    const hint = hints.items.find(item => item.requestId === requestId)
    if (hint) hints.remove(hint)
})

function canViewError(hint: Hint) {
    return Boolean(hint.requestId)
        && session.isAuthenticated
        && hasRole(session.user, "developer")
}

function getColor(hint: Hint) {
    switch (hint.type) {
        case "message":
            return "hint-neutral"
        case "success":
            return "success inverted"
        case "warning":
            return "warning inverted"
        case "error":
            return "danger inverted"
    }

    return "hint-neutral"
}
</script>

<template>
    <aside class="background g-2">
        <TransitionGroup name="hints">
        <template v-for="hint in hints.items" :key="hint.number">
            <div class="hint row inline g-3 text bold break br-small px-4 py-2" :class="getColor(hint)">
                <NuxtLink
                    v-if="canViewError(hint)"
                    class="hint-message"
                    :to="{ path: '/developer/errors', query: { requestId: hint.requestId } }"
                >
                    {{ hint.message }}
                </NuxtLink>
                <span v-else class="hint-message">{{ hint.message }}</span>
                <button
                    v-if="hint.type === 'error'"
                    class="hint-dismiss p-1"
                    type="button"
                    title="Dismiss error"
                    @click="hints.remove(hint)"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        </template>
        </TransitionGroup>
    </aside>
</template>

<style scoped lang="scss">
aside.background {
    width: 100%;
    position: absolute;
    align-items: center;
    pointer-events: none;
    isolation: isolate;
    z-index: 10000;
    
    @media only screen and (max-aspect-ratio: 1/1) {
        top: 0;
        display: flex;
        flex-direction: column-reverse;
        margin-top: 10rem;
    }
    
    @media only screen and (min-aspect-ratio: 1/1) {
        bottom: 0;
        @include flex-v;
        margin-bottom: 10rem;
    }
}


.hint {
    pointer-events: all;
    position: relative;
    width: fit-content;
    max-width: 60rem;
    
    box-shadow: 0.25rem 0.25rem 1rem -0.25rem $white-3,
                0 0 0.33rem 1px $white-3;
}

.hint-neutral {
    color: $black-0;
    background-color: $white-2;
}

.hint-message {
    flex: 1;
}

button.hint-dismiss {
    flex: none;
    border: 0;
    color: inherit;
    background: transparent;
}

.hints-move, .hints-enter-active, .hints-leave-active {
    transition:
        opacity var(--motion-duration-fast) var(--motion-easing-standard),
        transform var(--motion-duration-fast) var(--motion-easing-standard);
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