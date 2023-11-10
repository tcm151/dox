import type { Ref } from "vue";

// REFACTOR remove datasources, I don't like them anymore...

export interface DatasourceItem<T> {
    value: Ref<T | null>
    options: ItemOptions
    loading: Ref<boolean>
    fetch(): Promise<void>
    update(): Promise<boolean>
}

interface ItemOptions {
    fetch: {
        url: () => string
        query?: {
            [key: string]: any
        }
        error: {
            message: string
            handler?: Function
        }
    }
    update?: {
        url: string
        error: {
            message: string
            handler?: Function
        }
    }
}

function defineItem<T>(options: ItemOptions): DatasourceItem<T | null> {

    const session = getSession()
    
    const { data, error, pending, refresh } = useAsyncData<T>(options.fetch.url(), () => $fetch(options.fetch.url(), {
        headers: {
            Authorization: `Bearer ${session.token}`,
        },
    }))

    watch(error, (value: any) => {
        if (value) {
            options.fetch.error.handler?.(error.value)
        }
    })

    if (options.fetch.query) {
        watch(options.fetch.query!, async () => {
            return await fetch()
        })
    }

    async function fetch() {
        await refresh()
    }
    
    async function update() {
        if (!options.update) {
            return true
        }

        const response = await useAsyncData(() => $fetch(options.update!.url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${session.token}`,
            },
            body: data,
        }))
    
        if (response.error.value) {
            options.update.error.handler?.(response.error.value)
            return false
        }
        else {
            return true
        }
    }

    return { value: data as Ref<T | null>, options, loading: pending, fetch, update }
}

export interface DatasourceList<T> {
    items: Ref<T[] | null>
    options: ListOptions
    loading: Ref<boolean>
    fetch(): Promise<void>
    create(items: T[]): Promise<boolean>
    update(items: T[]): Promise<boolean>
    remove(items: T[]): Promise<boolean>
}

interface ListOptions {
    fetch: {
        url: () => string
        query?: {
            [key: string]: any
        }
        error: {
            message: string
            handler?: Function
        }
    }
    create?: {
        url: string
        error: {
            message: string
            handler?: Function
        }
    }
    update?: {
        url: string
        error: {
            message: string
            handler?: Function
        }
    }
    remove?: {
        url: string
        error: {
            message: string
            handler?: Function
        }
    }
}

function defineList<T>(options: ListOptions): DatasourceList<T> {

    const session = getSession()
    
    const { data, error, pending, refresh } = useAsyncData<T[]>(options.fetch.url(), () => $fetch(options.fetch.url(), {
        headers: {
            Authorization: `Bearer ${session.token}`,
        },
    }))

    watch(error, (value: any) => {
        if (value) {
            options.fetch.error.handler?.(error.value)
        }
    })

    async function fetch() {
        await refresh()
    }
    
    async function create<T>(items: T[]) {
        if (!options.create || items.length === 0) {
            return true
        }
    
        const response = await useAsyncData(() => $fetch(options.create!.url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${session.token}`,
            },
            body: items,
        }))

        if (response.error.value) {
            options.create.error.handler?.(response.error.value)
            return false
        }
        else {
            return true
        }
    }
    
    async function update<T>(items: T[]) {
        if (!options.update || items.length === 0) {
            return true
        }
    
        const response = await useAsyncData(() => $fetch(options.update!.url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${session.token}`,
            },
            body: items,
        }))
    
        if (response.error.value) {
            options.update.error.handler?.(response.error.value)
            return false
        }
        else {
            return true
        }
    }
    
    async function remove<T>(items: T[]) {
        if (!options.remove || items.length === 0) {
            return true
        }
    
        const response = await useAsyncData(() => $fetch(options.remove!.url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${session.token}`,
            },
            body: items,
        }))
    
        if (response.error.value) {
            options.remove.error.handler?.(response.error.value)
            return false
        }
        else {
            return true
        }
    }

    return { items: data as Ref<T[] | null>, options, loading: pending, fetch, create, update, remove }
}


export default { defineItem, defineList }