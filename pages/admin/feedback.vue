<script setup lang="ts">
const { data: feedback } = useAsyncData("feedback", () => {
    return $fetch("/api/feedback")
})
</script>

<template>
    <article class="column g-2 p-4">
        <div class="feedback column g-2 p-2" v-for="item in feedback">
            <p>{{ item.content }}</p>
            <div class="row g-1">
                <span class="info">u/{{ item.user.name }}</span>
                <span class="info">{{ formatDate(item.time) }}</span>
            </div>
        </div>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width (400px, 1rem);
}

div.feedback {
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;

    p {
        font-weight: 600;
    }
}

div.row {
    span {
        cursor: pointer;
        padding: 0.25rem 1rem;
        font-size: 0.8rem;
        border-radius: 0.25rem;
        font-weight: 700;
    }
}
</style>