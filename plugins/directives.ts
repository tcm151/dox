export default defineNuxtPlugin((nuxtApp) => {
    
    nuxtApp.vueApp.directive("focusSelect", {
        mounted(element: HTMLInputElement, binding, vNode) {
            element.onfocus = () => {
                element.select()
            }
        }
    })
})