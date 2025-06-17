<script setup lang="ts">
import { Trigger } from '~/services/events'

const events = useEvents()
const settings = useSettings()

useNuxtApp().hook("page:finish", () => {
    events.publish(Trigger.pageFinishedLoading)
})

onMounted(() => {
    events.publish(Trigger.clientStarted)
})

await callOnce("app.settings", () => settings.fetch())

let showLogin = ref(false)
events.subscribe(Trigger.toggleLogin, () => showLogin.value = !showLogin.value)

let showUserManager = ref(false)
events.subscribe(Trigger.toggleUserManager, () => showUserManager.value = !showUserManager.value)

let showPopup = ref(false)
const popupTitle = ref<string>("")
const popupMessage = ref<string>("")
const handlingPopup = ref(false)
const popupOnAccept = ref<($event?: undefined) => any>(() => {})
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

if (import.meta.client) {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)

    window.addEventListener('resize', () => {
        const vh = window.innerHeight * 0.01
        document.documentElement.style.setProperty('--vh', `${vh}px`)
    })
}
</script>

<template>
    <NuxtLoadingIndicator />
    <Navbar />
    <Login :visible="showLogin" />
    <Popup :visible="showPopup" :loading="handlingPopup" :title="popupTitle" @accept="popupAccept" @decline="showPopup = false">
        {{ popupMessage }}
    </Popup>
    <UserManager :visible="showUserManager" @close="showUserManager = !showUserManager" />
    <NuxtLayout>
        <NuxtPage />
    </NuxtLayout>
    <Hints />
</template>

<style lang="scss">
main.page {
    height: calc(100vh - 40px);
    height: calc(var(--vh, 1vh) * 100 - 40px);
    background-color: $white-1;
    overflow-x: hidden;
    overflow-y: auto;

    > article, > section {
        // box-sizing: border-box;
        flex: 1 1;
    }
}

.swap-enter-active,
.swap-leave-active {
  transition: all 128ms ease-out;
}

.swap-leave-to,
.swap-enter-from {
    opacity: 0;
    filter: blur(0.25rem);
}
</style>