<script setup lang="ts">
// TODO messages are not complete

const showMessages = ref(false)
function toggleShowMessages() {
    showMessages.value = !showMessages.value
}

</script>

<template>
    <aside class="messages row g-2 pt-2" :class="{ open: showMessages }">
        <section class="toggle grid center p-2">
            <i v-if="!showMessages" class="fa-solid fa-circle-chevron-up" @click="toggleShowMessages"></i>
            <i v-else class="fa-solid fa-circle-chevron-down" @click="toggleShowMessages"></i>
        </section>
        <div class="f-1" />
        <TransitionGroup name="messages">
            <section v-if="showMessages" v-for="index in 3" class="chat row inline between px-3 py-2">
                <div class="row inline g-2">
                    <i class="fa-solid fa-comment"></i>
                    <span>User</span>
                </div>
                <i class="fa-solid fa-xmark"></i>
            </section>
        </TransitionGroup>
    </aside>
</template>

<style scoped lang="scss">

@property --gradient-black {
    syntax: '<color>';
    initial-value: rgba(255, 0, 0, 0);
    inherits: false;
}

@property --gradient-transparent {
    syntax: '<color>';
    initial-value: rgba(255, 0, 0, 0);
    inherits: false;
}

aside.messages {
    width: 100%;
    bottom: 0;
    position: absolute;
    justify-content: end;
    isolation: isolate;
    z-index: 10000;

    background: linear-gradient(to top, var(--gradient-black), var(--gradient-transparent));
    --gradient-black: rgba(255, 0, 0, 0);
    transition: --gradient-black 512ms ease;
}


aside.messages.open {
    background: linear-gradient(to top, var(--gradient-black), var(--gradient-transparent));
    --gradient-black: rgba(39, 40, 56, 0.25);
    transition: --gradient-black 512ms ease;
}

.messages-move, .messages-enter-active, .messages-leave-active {
    transition: all 512ms ease;
}

.messages-enter-from, .messages-leave-to {
    transform: translateY(100%);
}

section.toggle {
    font-size: 1.5rem;
    cursor: pointer;
}

section.chat {
    width: 200px;
    color: $white-0;
    border-radius: 0.25rem 0.25rem 0 0;
    background-color: $black-0;
    cursor: pointer;
}
</style>