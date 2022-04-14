t<template>
    <div class="control">
        <div class="tags has-addons">
            <div class="tag tag-content p-2 is-medium is-primary is-light">{{ contents }}</div>
            <div class="tag is-medium is-danger is-light is-delete" @click.prevent="$emit('delete', contents)">
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

defineProps<{ contents: string }>();
defineEmits(['submit', 'delete'])

</script>

<style scoped>
.tag {
    border: 1px solid lightgrey;
}

.tag-content {
    border-right: 0px;
}
</style>