<script setup lang="ts">

defineEmits(['sortBy'])

</script>

<template>
    <div class="sorting is-hidden-mobile">
        <div class="sort button" @click.prevent="$emit('sortBy', 'hot')">
            <div class="icon-text">
                <span class="icon">
                    <i class="fa-solid fa-fire"></i>
                </span>
                <span>Hot</span>
            </div>
        </div>
        <div class="sort button" @click.prevent="$emit('sortBy', 'top')">
            <div class="icon-text">
                <span class="icon">
                    <i class="fa-solid fa-arrow-up"></i>
                </span>
                <span>Top</span>
            </div>
        </div>
        <div class="sort button" @click.prevent="$emit('sortBy', 'new')">
            <div class="icon-text">
                <span class="icon">
                    <i class="fa-solid fa-egg"></i>
                </span>
                <span>New</span>
            </div>
        </div>
    </div>
    <div class="sorting is-mobile is-hidden-tablet">
        <div class="sort-mobile button" @click.prevent="$emit('sortBy', 'hot')">
            <i class="fa-solid fa-fire"></i>
        </div>
        <div class="sort-mobile button" @click.prevent="$emit('sortBy', 'top')">
            <i class="fa-solid fa-arrow-up"></i>
        </div>
        <div class="sort-mobile button" @click.prevent="$emit('sortBy', 'new')">
            <i class="fa-solid fa-egg"></i>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '../../styles/global.scss';

.sorting {
    @include flex-h;
    gap: 0.5em;

    span {
        font-size: 1em;
        font-weight: 600;
    }
}
</style>}