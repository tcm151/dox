<template>
    <Transition name="overlay-motion">
        <slot />
    </Transition>
</template>

<style scoped lang="scss">
:global(.overlay-motion-enter-active) {
    transition: opacity var(--motion-duration-quick) var(--motion-easing-overlay);
}

:global(.overlay-motion-leave-active) {
    transition: opacity var(--motion-duration-quick) var(--motion-easing-overlay);
}

:global(.overlay-motion-enter-from),
:global(.overlay-motion-leave-to) {
    opacity: 0;
}

:global(aside.background.overlay-motion-enter-active) {
    z-index: 10001;
}

:global(aside.background.overlay-motion-leave-active) {
    z-index: 10000;
}

:global(aside.background.overlay-motion-enter-active) {
    transition:
        opacity var(--motion-duration-quick) var(--motion-easing-overlay),
        backdrop-filter var(--motion-duration-quick) var(--motion-easing-overlay);
}

:global(.overlay-motion-enter-active aside.background),
:global(.overlay-motion-leave-active aside.background) {
    transition: backdrop-filter var(--motion-duration-quick) var(--motion-easing-overlay);
}

:global(aside.background.overlay-motion-leave-active) {
    transition:
        opacity var(--motion-duration-quick) var(--motion-easing-overlay),
        backdrop-filter var(--motion-duration-quick) var(--motion-easing-overlay);
}

:global(aside.background.overlay-motion-enter-from),
:global(.overlay-motion-enter-from aside.background),
:global(aside.background.overlay-motion-leave-to),
:global(.overlay-motion-leave-to aside.background) {
    backdrop-filter: none;
}

:global(.overlay-motion-enter-active .window) {
    transition: transform var(--motion-duration-quick) var(--motion-easing-overlay);
}

:global(.overlay-motion-leave-active .window) {
    transition: transform var(--motion-duration-quick) var(--motion-easing-overlay);
}

:global(.overlay-motion-enter-from .window),
:global(.overlay-motion-leave-to .window) {
    transform: translateY(0.75rem) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
    :global(aside.background.overlay-motion-enter-active),
    :global(.overlay-motion-enter-active aside.background),
    :global(aside.background.overlay-motion-leave-active),
    :global(.overlay-motion-leave-active aside.background) {
        transition: none;
    }
}
</style>
