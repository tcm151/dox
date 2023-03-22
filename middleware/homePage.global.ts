export default defineNuxtRouteMiddleware(async (to, from) => {
    if (to.fullPath === '/') {
        return navigateTo("/feed");
    }
})
