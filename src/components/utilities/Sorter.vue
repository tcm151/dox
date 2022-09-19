<script setup lang="ts">

defineProps<{ postFilter: string }>();
defineEmits(['toggleFilter', 'sortBy', 'navigateTo'])

</script>

<template>
    <div class="level mb-2 is-hidden-mobile">
        <div class="level-left">
            <div class="level-item button is-primary has-text-weight-bold" @click.prevent="$emit('toggleFilter')">
                {{ postFilter }}
            </div>
            <div class="level-item button has-text-weight-semibold" @click.prevent="$emit('sortBy', 'hot')">
                <div class="icon-text">
                    <span class="icon">
                        <i class="fa-solid fa-fire"></i>
                    </span>
                    <span>Hot</span>
                </div>
            </div>
            <div class="level-item button has-text-weight-semibold" @click.prevent="$emit('sortBy', 'top')">
                <div class="icon-text">
                    <span class="icon">
                        <i class="fa-solid fa-arrow-up"></i>
                    </span>
                    <span>Top</span>
                </div>
            </div>
            <div class="level-item button has-text-weight-semibold" @click.prevent="$emit('sortBy', 'new')">
                <div class="icon-text">
                    <span class="icon">
                        <i class="fa-solid fa-egg"></i>
                    </span>
                    <span>New</span>
                </div>
            </div>
            <div class="level-item button is-link has-text-weight-bold" @click.prevent="$emit('navigateTo', '/editor')">
                <span class="icon">
                    <i class="fa-solid fa-feather-pointed"></i>
                </span>
                <span>Post</span>
            </div>
        </div>
    </div>
    <div class="level mb-2 is-mobile is-hidden-tablet">
        <div class="level-item button filter is-primary has-text-weight-bold" @click.prevent="$emit('toggleFilter')">
            {{ postFilter }}
        </div>
        <div class="level-item button has-text-weight-semibold" @click.prevent="$emit('sortBy', 'hot')">
            <div class="icon-text">
                <span class="icon">
                    <i class="fa-solid fa-fire"></i>
                </span>
            </div>
        </div>
        <div class="level-item button has-text-weight-semibold" @click.prevent="$emit('sortBy', 'top')">
            <div class="icon-text">
                <span class="icon">
                    <i class="fa-solid fa-arrow-up"></i>
                </span>
            </div>
        </div>
        <div class="level-item button has-text-weight-semibold" @click.prevent="$emit('sortBy', 'new')">
            <div class="icon-text">
                <span class="icon">
                    <i class="fa-solid fa-egg"></i>
                </span>
            </div>
        </div>
        <div class="level-item button is-link has-text-weight-bold" @click.prevent="$emit('navigateTo', '/editor')">
            <span class="icon">
                <i class="fa-solid fa-feather-pointed"></i>
            </span>
        </div>
    </div>
</template>