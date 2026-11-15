import type { DirectiveBinding } from "vue"

export default defineNuxtPlugin((nuxtApp) => {
    
    nuxtApp.vueApp.directive("focusSelect", (element: HTMLInputElement) => {
        element.onfocus = () => {
            element.select()
        }
    })

    interface Draggable {
        dragStart?: (event: DragEvent) => void
        dragEnter?: (event: DragEvent) => void
        dragOver?: (event: DragEvent) => void
    }

    nuxtApp.vueApp.directive("draggable", (element: HTMLElement, binding: DirectiveBinding<Draggable>) => {
        element.draggable = true
        element.ondragstart = (event) => {
            event.preventDefault()
            binding.value.dragStart?.(event)
        }
        element.ondragenter = (event) => {
            event.preventDefault()
            binding.value.dragEnter?.(event)
        }
        element.ondragover = (event) => {
            event.preventDefault()
            binding.value.dragOver?.(event)
        }
    })

    const scrollPositions = new Map<string, number>()
    const scrollPositionKeys = new WeakMap<HTMLElement, string>()

    function saveScrollPosition(element: HTMLElement, key: string) {
        scrollPositions.set(key, element.scrollTop)
    }

    function restoreScrollPosition(element: HTMLElement, key: string) {
        if (element.isConnected && scrollPositionKeys.get(element) === key) {
            element.scrollTop = scrollPositions.get(key) ?? 0
        }
    }

    function scheduleScrollRestore(element: HTMLElement, key: string) {
        nuxtApp.hooks.hookOnce("page:transition:finish", () => restoreScrollPosition(element, key))
    }

    nuxtApp.vueApp.directive("scrollPosition", {
        mounted(element: HTMLElement, binding: DirectiveBinding<string>) {
            scrollPositionKeys.set(element, binding.value)
            requestAnimationFrame(() => restoreScrollPosition(element, binding.value))
            scheduleScrollRestore(element, binding.value)
        },
        beforeUpdate(element: HTMLElement, binding: DirectiveBinding<string>) {
            const previousKey = scrollPositionKeys.get(element)
            if (previousKey && previousKey !== binding.value) saveScrollPosition(element, previousKey)
        },
        updated(element: HTMLElement, binding: DirectiveBinding<string>) {
            if (scrollPositionKeys.get(element) === binding.value) return

            scrollPositionKeys.set(element, binding.value)
            scheduleScrollRestore(element, binding.value)
        },
        beforeUnmount(element: HTMLElement) {
            const key = scrollPositionKeys.get(element)
            if (key) saveScrollPosition(element, key)
            scrollPositionKeys.delete(element)
        },
    })

    interface DragScrollState {
        pointerId: number | undefined
        startX: number
        startScrollLeft: number
        didDrag: boolean
        suppressClick: boolean
        clickTimer: ReturnType<typeof setTimeout> | undefined
        settleTimer: ReturnType<typeof setTimeout> | undefined
        settleHandler: (() => void) | undefined
    }

    const dragScrollStates = new WeakMap<HTMLElement, DragScrollState>()

    function finishDragScroll(element: HTMLElement, state: DragScrollState) {
        if (state.settleTimer) clearTimeout(state.settleTimer)
        if (state.settleHandler) element.removeEventListener("scrollend", state.settleHandler)
        state.settleTimer = undefined
        state.settleHandler = undefined
        element.classList.remove("settling")
    }

    function startDragScroll(event: PointerEvent) {
        const element = event.currentTarget as HTMLElement
        const state = dragScrollStates.get(element)
        if (!state || event.pointerType !== "mouse" || event.button !== 0 || element.scrollWidth <= element.clientWidth) return

        finishDragScroll(element, state)
        state.pointerId = event.pointerId
        state.startX = event.clientX
        state.startScrollLeft = element.scrollLeft
        state.didDrag = false
        element.setPointerCapture(event.pointerId)
    }

    function moveDragScroll(event: PointerEvent) {
        const element = event.currentTarget as HTMLElement
        const state = dragScrollStates.get(element)
        if (!state || state.pointerId !== event.pointerId) return

        const distance = event.clientX - state.startX
        if (!state.didDrag && Math.abs(distance) < 4) return

        state.didDrag = true
        element.classList.add("dragging")
        element.scrollLeft = state.startScrollLeft - distance
    }

    function endDragScroll(event: PointerEvent) {
        const element = event.currentTarget as HTMLElement
        const state = dragScrollStates.get(element)
        if (!state || state.pointerId !== event.pointerId) return

        if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId)
        state.pointerId = undefined
        if (!state.didDrag) {
            element.classList.remove("dragging")
            return
        }

        element.classList.add("settling")
        element.classList.remove("dragging")
        state.didDrag = false
        state.suppressClick = true
        if (state.clickTimer) clearTimeout(state.clickTimer)
        state.clickTimer = setTimeout(() => {
            state.suppressClick = false
            state.clickTimer = undefined
        }, 0)

        requestAnimationFrame(() => {
            if (!element.isConnected) return

            const slides = Array.from(element.children).filter((child): child is HTMLElement => child instanceof HTMLElement)
            const firstSlide = slides[0]
            if (!firstSlide) return

            const bounds = element.getBoundingClientRect()
            const center = bounds.left + element.clientWidth / 2
            const closestSlide = slides.reduce((closest, slide) => {
                const slideCenter = slide.getBoundingClientRect().left + slide.offsetWidth / 2
                const closestCenter = closest.getBoundingClientRect().left + closest.offsetWidth / 2
                return Math.abs(slideCenter - center) < Math.abs(closestCenter - center) ? slide : closest
            }, firstSlide)
            const slideCenter = closestSlide.getBoundingClientRect().left + closestSlide.offsetWidth / 2
            const targetScrollLeft = element.scrollLeft + slideCenter - center
            if (Math.abs(targetScrollLeft - element.scrollLeft) < 1) {
                finishDragScroll(element, state)
                return
            }

            state.settleHandler = () => finishDragScroll(element, state)
            element.addEventListener("scrollend", state.settleHandler, { once: true })
            state.settleTimer = setTimeout(state.settleHandler, 1500)
            element.scrollTo({
                left: targetScrollLeft,
                behavior: "smooth",
            })
        })
    }

    function preventDragScrollClick(event: MouseEvent) {
        const element = event.currentTarget as HTMLElement
        const state = dragScrollStates.get(element)
        if (!state?.suppressClick) return

        event.preventDefault()
        event.stopPropagation()
        state.suppressClick = false
        if (state.clickTimer) clearTimeout(state.clickTimer)
        state.clickTimer = undefined
    }

    nuxtApp.vueApp.directive("dragScroll", {
        mounted(element: HTMLElement) {
            dragScrollStates.set(element, {
                pointerId: undefined,
                startX: 0,
                startScrollLeft: 0,
                didDrag: false,
                suppressClick: false,
                clickTimer: undefined,
                settleTimer: undefined,
                settleHandler: undefined,
            })
            element.addEventListener("pointerdown", startDragScroll)
            element.addEventListener("pointermove", moveDragScroll)
            element.addEventListener("pointerup", endDragScroll)
            element.addEventListener("pointercancel", endDragScroll)
            element.addEventListener("click", preventDragScrollClick, true)
        },
        unmounted(element: HTMLElement) {
            const state = dragScrollStates.get(element)
            if (state) finishDragScroll(element, state)
            if (state?.pointerId !== undefined && element.hasPointerCapture(state.pointerId)) {
                element.releasePointerCapture(state.pointerId)
            }
            if (state?.clickTimer) clearTimeout(state.clickTimer)
            element.removeEventListener("pointerdown", startDragScroll)
            element.removeEventListener("pointermove", moveDragScroll)
            element.removeEventListener("pointerup", endDragScroll)
            element.removeEventListener("pointercancel", endDragScroll)
            element.removeEventListener("click", preventDragScrollClick, true)
            dragScrollStates.delete(element)
        },
    })
})