<script setup lang="ts">
const props = defineProps<{
    mode?: "default" | "in-out" | "out-in"
}>()

function getHeight(panel: HTMLElement) {
    const style = getComputedStyle(panel)
    const renderedHeight = panel.getBoundingClientRect().height
    if (style.boxSizing === "border-box") return renderedHeight

    const verticalPadding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom)
    const verticalBorder = Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth)
    return Math.max(0, renderedHeight - verticalPadding - verticalBorder)
}

function beforeEnter(element: Element) {
    const panel = element as HTMLElement
    panel.style.height = "0px"
    panel.style.overflow = "hidden"
    void panel.offsetHeight
}

function enter(element: Element) {
    const panel = element as HTMLElement
    panel.style.height = "auto"
    const height = getHeight(panel)
    panel.style.height = "0px"
    void panel.offsetHeight

    requestAnimationFrame(() => {
        panel.style.height = `${height}px`
    })
}

function afterEnter(element: Element) {
    const panel = element as HTMLElement
    panel.style.height = ""
    panel.style.overflow = ""
}

function beforeLeave(element: Element) {
    const panel = element as HTMLElement
    panel.style.height = `${getHeight(panel)}px`
    panel.style.overflow = "hidden"
    void panel.offsetHeight
}

function leave(element: Element) {
    const panel = element as HTMLElement
    panel.style.height = "0px"
}

function afterLeave(element: Element) {
    const panel = element as HTMLElement
    panel.style.height = ""
    panel.style.overflow = ""
}
</script>

<template>
    <Transition
        name="collapse-height"
        :mode="props.mode"
        @before-enter="beforeEnter"
        @enter="enter"
        @after-enter="afterEnter"
        @enter-cancelled="afterEnter"
        @before-leave="beforeLeave"
        @leave="leave"
        @after-leave="afterLeave"
        @leave-cancelled="afterLeave"
    >
        <slot />
    </Transition>
</template>

<style scoped lang="scss">
:global(.collapse-height-enter-active),
:global(.collapse-height-leave-active) {
    transition: height var(--motion-duration-lazy) var(--motion-easing-expand);
}
</style>