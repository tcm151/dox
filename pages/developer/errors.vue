<script setup lang="ts">
import type { Error } from '~/types'

const cache = useCache()

const { data: errors } = await useDatasource<Error[]>("/api/developer/error")

const expanded = cache.get<string[]>("developer.expanded", () => [])
function toggle(id: string) {
    if (expanded.value.includes(id)) {
        expanded.value = expanded.value.filter(e => e != id)
    }
    else {
        expanded.value.push(id)
    }
}

</script>
    
<template>
    <article class="p-4">
        <section v-if="errors && errors.length > 0"class="box column g-2 p-3">
            <template v-for="error in errors" :key="error.id">
                <div class="column g-2">
                    <div class="row g-1">
                        <Tag type="danger" :label="error.status" />
                        <Tag class="f-1" type="link" :label="error.description" @click="toggle(error.id)" />
                        <UserTag width="12rem" :user="error.user" label="unknown" />
                        <DurationTag width="6rem" :time="error.time" />
                    </div>
                    <footer v-if="expanded.includes(error.id)" class="column g-2">
                        <Codeblock :code="JSON.stringify(error.request, undefined, 4)" />
                        <Codeblock :code="error.stack" />
                        <template v-if="Object.keys(error.data).length > 0">
                            <Codeblock  :code="JSON.stringify(error.data, undefined, 4)" />
                        </template>
                    </footer>
                </div>
            </template>
        </section>
        <section v-else class="box p-3 text center">
            <p>There are currently no errors.</p>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(80rem, 1rem);
}

</style>