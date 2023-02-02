<script setup lang="ts">
const props = defineProps<{
    items: any[]
    children: any[]
    getChildren: Function
}>()

function computeChildren(item: any) {
    let children = props.getChildren(item, props.items)
    console.log(children);
    return children;
}
</script>

<template>
    <div class="tree" v-if="children.length > 0">
        <div class="item" v-for="item in children" :key="item.id">
            <slot name="item" :item="item">
            </slot>
            <div class="ml-5" v-if="computeChildren(item).length > 0">
                <Tree :items="items" :children="computeChildren(item)" :get-children="getChildren">
                    <template #item="{ item: child }">
                        <slot name="child" :item="child">
                        </slot>
                    </template>
                </Tree>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '~/assets/global.scss';

.item {
    @include flex-v;
}
</style>