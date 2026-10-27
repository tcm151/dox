<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()
const events = useEvents()
const settings = useSettings()
const hints = useHints()

useSeoMeta({
    title: config.public.site.title,
    robots: { index: true },
    ogSiteName: config.public.site.title,
})

const appUnavailable = computed(() => route.path === "/unavailable")
if (!appUnavailable.value) {
    await callOnce("app.settings", () => settings.refresh())
}

// REFACTOR replace full router reload auth refresh with targeted state hydration.
// events.subscribe(Trigger.authenticatedUser, () => useRouter().go(0))

let showLogin = ref(false)
events.subscribe(Trigger.toggleLogin, () => showLogin.value = !showLogin.value)

let showUserManager = ref(false)
events.subscribe(Trigger.toggleUserManager, () => showUserManager.value = !showUserManager.value)

const showFeedback = ref(false)
events.subscribe(Trigger.toggleFeedback, () => showFeedback.value = !showFeedback.value)

let showPopup = ref(false)
const popupTitle = ref<string>("")
const popupMessage = ref<string>("")
const handlingPopup = ref(false)
const popupOnAccept = ref<() => any>(() => {})

events.subscribe(Trigger.showPopup, (payload: any) => {
    popupTitle.value = payload.title
    popupMessage.value = payload.message
    popupOnAccept.value = payload.accept
    showPopup.value = true
})

async function popupAccept() {
    try {
        handlingPopup.value = true
        await popupOnAccept.value()
        showPopup.value = false
    }
    finally {
        handlingPopup.value = false
    }
}

function closePopup() {
    showPopup.value = false
}

if (ENV.isClient()) {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)

    window.addEventListener('resize', () => {
        const vh = window.innerHeight * 0.01
        document.documentElement.style.setProperty('--vh', `${vh}px`)
    })
}
</script>

<template>
    <NuxtPage v-if="appUnavailable" />
    <template v-else>
        <NuxtLoadingIndicator />
        <Navbar />
        <OverlayTransition>
            <Login v-show="showLogin" />
        </OverlayTransition>
        <Reporter />
        <OverlayTransition>
            <Popup v-if="showPopup" :loading="handlingPopup" :title="popupTitle" :accept="{ action: popupAccept }" :decline="{ action: closePopup }">
                {{ popupMessage }}
            </Popup>
        </OverlayTransition>
        <OverlayTransition>
            <UserManager v-show="showUserManager" @close="showUserManager = !showUserManager" />
        </OverlayTransition>
        <OverlayTransition>
            <Window v-if="settings.app.misc.feedback.enabled && showFeedback" title="Submit Feedback" icon="fa-solid fa-keyboard" width="40rem" @close="showFeedback = false">
                <Feedback placeholder="Tell us what you think..." @submit="showFeedback = false" />
            </Window>
        </OverlayTransition>
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
        <Hints />
    </template>
</template>

<style lang="scss">
main.page {
    height: calc(100vh - 40px);
    height: calc(var(--vh, 1vh) * 100 - 40px);
    background-color: $white-1;
    overflow-x: hidden;
    overflow-y: auto;

    > article, > section {
        flex: 1 1;
    }
}

.swap-enter-active,
.swap-leave-active {
        transition:
                opacity var(--motion-duration-fast) var(--motion-easing-out),
                filter var(--motion-duration-fast) var(--motion-easing-out);
}

.swap-leave-to,
.swap-enter-from {
    opacity: 0;
    filter: blur(0.25rem);
}

</style>