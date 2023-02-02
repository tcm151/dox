<script setup lang="ts">
const props = defineProps<{
    items: any[]
    children: any[]
    getChildren: Function
}>()
</script>

<template>
    <div class="tree" v-if="children.length > 0">
        <div class="outside" v-for="item in children" :key="item.id">
            <div class="comment-line"></div>
            <div class="item">
                <slot name="item" :item="item">
                </slot>
                <div class="ml-5" v-if="getChildren(item, items).length > 0">
                    <Tree :items="items" :children="getChildren(item, items)" :get-children="getChildren">
                        <template v-for="(_, slot) in $slots" v-slot:[slot]="scope: any">
                            <slot :name="slot" v-bind="scope ?? {}">
                            </slot>
                        </template>
                    </Tree>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '~/assets/global.scss';

.comment-line {
    width: 0.25em;
    margin-right: 0.25rem;
    border-radius: 0.25em;
    background-color: $dox-white;
}

.outside {
    @include flex-h;
}

.item {
    @include flex-v;
}
</style>