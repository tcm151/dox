<script setup lang="ts">
import type { Error } from '~/types'

const cache = useCache()

const limit = cache.get<number>("errors.limit", () => 25)
const codes = cache.get<number[]>("errors.codes", () => [500])
const start = cache.get<string>("errors.start", () => "")
const end = cache.get<string>("errors.end", () => "")
const { data: errors } = await useDatasource<Error[]>("/api/developer/error", {
    query: {
        limit, codes, start, end 
    }
})

function toggleStatus(code: number) {
    if (codes.value.includes(code)) {
        codes.value = codes.value.filter(c => c != code)
    }
    else {
        codes.value.push(code)
    }
}

function selectStatus(code: number) {
    codes.value = [code]
}

const expanded = ref<string[]>("developer.expanded", () => [])
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
        <section class="box column g-2 p-3">
            <header class="row wrap gr-2 gc-4">
                <div class="row g-4">
                    <div class="field row">
                        <label>Results</label>
                        <select v-model.number="limit">
                            <option>25</option>
                            <option>50</option>
                            <option>100</option>
                            <option>250</option>
                        </select>
                    </div>
                    <div class="field row">
                        <label>Codes</label>
                        <div class="row g-1">
                            <template v-for="code in [401, 403, 404, 429, 500, 503]">
                                <span
                                    class="tag danger"
                                    :class="{ active: codes.includes(code) }"
                                    @click="toggleStatus(code)"
                                    @click.ctrl="selectStatus(code)"
                                >
                                    {{ code }}
                                </span>
                            </template>
                        </div>
                    </div>
                </div>
                <div class="row g-4">
                    <div class="field row">
                        <label>Start</label>
                        <input type="date" v-model="start">
                    </div>
                    <div class="field row">
                        <label>End</label>
                        <input type="date" v-model="end">
                    </div>
                </div>
            </header>
            <template v-if="errors && errors.length > 0">
                <template v-for="error in errors" :key="error.id">
                    <div class="column g-2">
                        <div class="row g-1">
                            <Tag type="danger" :label="error.status" />
                            <Tag class="f-1" type="link" :label="error.description" @click="toggle(error.id)" />
                            <UserTag width="12rem" :user="error.user" label="unknown" />
                            <DurationTag width="6rem" :time="error.time" />
                        </div>
                        <footer v-if="expanded.includes(error.id)" class="column g-2">
                            <Codeblock :code="`${error.stack}\n\n${JSON.stringify({ ...error.request, data: error.data }, undefined, 4)}`" />
                        </footer>
                    </div>
                </template>
            </template>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(80rem, 1rem);
}



div.field {
    label {
        font-weight: 700;
    }
    input, textarea, select {
        padding: 0.25rem 0.5rem;
        font-size: 0.8rem;
    }
    .danger.active {
        background-color: $red;
        color: $red-light;
    }
}
</style>