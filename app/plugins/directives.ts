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
    const scrollRestoreObservers = new WeakMap<HTMLElement, MutationObserver>()
    const pendingScrollRestores = new WeakMap<HTMLElement, string>()
    const scrollPositionHandlers = new WeakMap<
        HTMLElement,
        {
            save: () => void
            markUserScroll: () => void
            cancelRestore: () => void
            pointerDown: () => void
            keyDown: (event: KeyboardEvent) => void
        }
    >()

    function saveScrollPosition(element: HTMLElement, key: string) {
        scrollPositions.set(key, element.scrollTop)
    }

    function stopWatchingScrollPosition(element: HTMLElement) {
        scrollRestoreObservers.get(element)?.disconnect()
        scrollRestoreObservers.delete(element)
        pendingScrollRestores.delete(element)
    }

    function restoreScrollPosition(element: HTMLElement, key: string) {
        if (!element.isConnected || scrollPositionKeys.get(element) !== key) return false

        const position = scrollPositions.get(key) ?? 0
        pendingScrollRestores.set(element, key)
        element.scrollTop = position
        if (element.scrollTop !== position) return false

        stopWatchingScrollPosition(element)
        return true
    }

    function scheduleScrollRestore(element: HTMLElement, key: string) {
        nuxtApp.hooks.hookOnce("page:transition:finish", () => {
            if (scrollPositionKeys.get(element) !== key || restoreScrollPosition(element, key)) return

            const observer = new MutationObserver(() => restoreScrollPosition(element, key))
            scrollRestoreObservers.set(element, observer)
            observer.observe(element, { childList: true, subtree: true })
        })
    }

    nuxtApp.vueApp.directive("scrollPosition", {
        mounted(element: HTMLElement, binding: DirectiveBinding<string>) {
            scrollPositionKeys.set(element, binding.value)
            const handlers = {
                userScrollKey: undefined as string | undefined,
                userScrollFrame: undefined as number | undefined,
                save: () => {
                    const key = handlers.userScrollKey
                    if (!key || pendingScrollRestores.get(element) === key) return
                    saveScrollPosition(element, key)
                },
                markUserScroll: () => {
                    handlers.userScrollKey = scrollPositionKeys.get(element)
                    if (handlers.userScrollFrame !== undefined) cancelAnimationFrame(handlers.userScrollFrame)
                    handlers.userScrollFrame = requestAnimationFrame(() => {
                        handlers.userScrollKey = undefined
                        handlers.userScrollFrame = undefined
                    })
                    stopWatchingScrollPosition(element)
                },
                cancelRestore: () => {
                    stopWatchingScrollPosition(element)
                    handlers.userScrollKey = undefined
                    if (handlers.userScrollFrame !== undefined) {
                        cancelAnimationFrame(handlers.userScrollFrame)
                        handlers.userScrollFrame = undefined
                    }
                },
                pointerDown: () => {
                    const key = scrollPositionKeys.get(element)
                    if (key && pendingScrollRestores.get(element) !== key) saveScrollPosition(element, key)
                    handlers.cancelRestore()
                },
                keyDown: (event: KeyboardEvent) => {
                    if ([" ", "ArrowDown", "ArrowUp", "End", "Home", "PageDown", "PageUp"].includes(event.key)) {
                        handlers.markUserScroll()
                    } else {
                        handlers.cancelRestore()
                    }
                },
            }
            scrollPositionHandlers.set(element, handlers)
            element.addEventListener("scroll", handlers.save)
            element.addEventListener("wheel", handlers.markUserScroll, { passive: true })
            element.addEventListener("touchmove", handlers.markUserScroll, { passive: true })
            element.addEventListener("pointerdown", handlers.pointerDown)
            element.addEventListener("keydown", handlers.keyDown)
            requestAnimationFrame(() => restoreScrollPosition(element, binding.value))
            scheduleScrollRestore(element, binding.value)
        },
        updated(element: HTMLElement, binding: DirectiveBinding<string>) {
            const previousKey = scrollPositionKeys.get(element)
            if (previousKey === binding.value) return

            stopWatchingScrollPosition(element)
            scrollPositionKeys.set(element, binding.value)
            scheduleScrollRestore(element, binding.value)
        },
        beforeUnmount(element: HTMLElement) {
            stopWatchingScrollPosition(element)
            const handlers = scrollPositionHandlers.get(element)
            if (handlers) {
                handlers.cancelRestore()
                element.removeEventListener("scroll", handlers.save)
                element.removeEventListener("wheel", handlers.markUserScroll)
                element.removeEventListener("touchmove", handlers.markUserScroll)
                element.removeEventListener("pointerdown", handlers.pointerDown)
                element.removeEventListener("keydown", handlers.keyDown)
                scrollPositionHandlers.delete(element)
            }
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
        if (!state || event.pointerType !== "mouse" || event.button !== 0 || element.scrollWidth <= element.clientWidth)
            return

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


    // $bp-compact: 400px;
    // $bp-mobile: 500px;
    // $bp-tablet: 600px;
    // $bp-laptop: 800px;
    // $bp-desktop: 1000px;
    const BREAKPOINTS = {
        sm: 500, // match $bp-mobile
        md: 600, // match $bp-tablet
        lg: 1000, // match $bp-desktop
    } as const

    type BreakpointKey = keyof typeof BREAKPOINTS | "auto"

    nuxtApp.vueApp.directive("adaptive", {
        mounted(element: HTMLElement, binding: any) {
            const tier: BreakpointKey = (binding.arg as BreakpointKey) || binding.value || "auto"
            element.classList.add("adaptive", tier)

            let requiredWidth = 0

            const measureNaturalWidth = () => {
                const wasCompact = element.classList.contains("compact")
                if (wasCompact) element.classList.remove("compact")

                const children = Array.from(element.children) as HTMLElement[]
                if (children.length === 0) {
                    requiredWidth = 0
                    if (wasCompact) element.classList.add("compact")
                    return
                }

                const prevShrinks = children.map((c) => c.style.flexShrink)
                const prevWrap = element.style.flexWrap

                element.style.flexWrap = "nowrap"
                children.forEach((c) => (c.style.flexShrink = "0"))

                const parentStyle = getComputedStyle(element)
                const padLeft = parseFloat(parentStyle.paddingLeft) || 0
                const padRight = parseFloat(parentStyle.paddingRight) || 0

                const first = children[0]!
                const last = children[children.length - 1]!
                const firstMarginLeft = parseFloat(getComputedStyle(first).marginLeft) || 0
                const lastMarginRight = parseFloat(getComputedStyle(last).marginRight) || 0

                // Exact span from the first child's outer left edge to the last child's outer right edge
                const contentSpan =
                    last.getBoundingClientRect().right -
                    first.getBoundingClientRect().left +
                    firstMarginLeft +
                    lastMarginRight

                // Total inner width needed (matches clientWidth box model + 1px sub-pixel buffer)
                requiredWidth = Math.ceil(contentSpan + padLeft + padRight) + 1

                children.forEach((c, i) => (c.style.flexShrink = prevShrinks[i]!))
                element.style.flexWrap = prevWrap
                if (wasCompact) element.classList.add("compact")
            }

            const update = () => {
                if (tier === "auto" && requiredWidth === 0) {
                    measureNaturalWidth()
                }
                // clientWidth is the exact inner width before horizontal overflow starts
                const availableWidth = element.clientWidth
                const threshold = tier === "auto" ? requiredWidth : BREAKPOINTS[tier]
                element.classList.toggle("compact", availableWidth < threshold)
            }

            update()
            document.fonts?.ready.then(() => {
                if (tier === "auto") {
                    measureNaturalWidth()
                    update()
                }
            })

            const resizeObserver = new ResizeObserver(() => update())
            resizeObserver.observe(element)

            let mutationObserver: MutationObserver | undefined
            if (tier === "auto") {
                mutationObserver = new MutationObserver(() => {
                    measureNaturalWidth()
                    update()
                })
                mutationObserver.observe(element, { childList: true, subtree: true, characterData: true })
            }

            ;(element as any).adaptiveCleanup = () => {
                resizeObserver.disconnect()
                mutationObserver?.disconnect()
            }
        },
        unmounted(element: HTMLElement) {
            ;(element as any).adaptiveCleanup?.()
        },
    })
})
