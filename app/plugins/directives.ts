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
})