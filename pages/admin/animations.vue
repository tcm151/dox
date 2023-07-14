<script setup lang="ts">
const showTop = ref(true)
const showMiddle = ref(true)
</script>

<template>
    <article class="p-5">
        <header class="row g-2">
            <button @click="showTop = !showTop">
                Toggle Top
            </button>
            <button @click="showMiddle = !showMiddle">
                Toggle Middle
            </button>
        </header>
        <div class="column g-4 mt-4" style="position: relative;">
            <TransitionGroup name="scale-up">
                <section class="top" v-if="showTop" key="top">
                    <h1>Top</h1>
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat suscipit rerum recusandae ducimus cum, soluta impedit esse iusto, beatae doloremque dolor eligendi aliquam iste sit consectetur! Reiciendis odit sed optio.</p>
                </section>
                <section class="middle" v-if="showMiddle" key="middle">
                    <h2>Middle</h2>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Tempora id iure nostrum optio, et molestiae dicta qui eveniet eius, sint architecto temporibus suscipit similique assumenda, hic adipisci officia consequatur vitae.</p>
                </section>
            </TransitionGroup>
        </div>
    </article>
</template>

<style lang="scss">
.scale-up-move,
.scale-up-enter-active,
.scale-up-leave-active {
  transition: all 256ms ease;
}

.scale-up-enter-from {
    opacity: 0;
    transform: translateY(-50%) scaleY(0);
}

.scale-up-leave-to {
    opacity: 0;
    transform: translateY(-50%) scaleY(0);
}

.scale-up-leave-active:not(:last-child) {
    position: absolute;
}
</style>

<style scoped lang="scss">
article {
    @include fit-width(800px, 1rem);
}
</style>