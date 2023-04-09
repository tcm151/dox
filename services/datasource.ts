import { Ref } from "vue";

const hints = useHints()
const events = useEvents()
const session = getSession()

export interface DatasourceItem<T> extends Ref<T> {
    options: ItemOptions
    loading: Ref<boolean>
    fetch(): Promise<boolean>
    create(): Promise<boolean>
    update(): Promise<boolean>
    remove(): Promise<boolean>
}

interface ItemOptions {
    clear: boolean
    fetch: {
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
}

export function createDatasourceItem<T>(options: ItemOptions): DatasourceItem<T | null> {
    
    const { data, error, pending, refresh } = useAsyncData<T>(options.fetch.url, () => $fetch(options.fetch.url, {
        headers: {
            Authorization: `Bearer ${session.token}`,
        },
    }))

    const datasource = data as DatasourceItem<T | null>

    watch(error, (value: any) => {
        if (value) {
            hints.addError(value.data.message)
            hints.addError(options.fetch.error.message)
            options.fetch.error.handler?.()
        }
    })

    if (options.clear) {
        events.subscribe("switchedTenant", () => refresh())
    }

    datasource.fetch = async (): Promise<boolean> => {
        await refresh()
        return true
    }
    
    datasource.update = async (): Promise<boolean> => {
        if (!options.update) {
            return true
        }

        const response = await useAsyncData(() => $fetch(options.update!.url, {
            // TODO convert to PUT/PATCH
            method: "POST",
            headers: {
                Authorization: `Bearer ${session.token}`,
            },
            body: data,
        }))
    
        if (response.error.value) {
            hints.addError(options.update.error.message)
            options.update.error.handler?.(response.error.value)
            return false
        }
        else {
            return true
        }
    }

    return datasource
    // return { data: data as Ref<T | null>, options, loading: pending, fetch, update }
}

export interface DatasourceList<T> extends Ref<T> {
    options: ListOptions
    loading: Ref<boolean>
    fetch(): Promise<boolean>
    create(items: T[]): Promise<boolean>
    update(items: T[]): Promise<boolean>
    remove(items: T[]): Promise<boolean>
}

interface ListOptions {
    clear: boolean
    fetch: {
        url: string
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

export function createDatasourceList<T>(options: ListOptions): DatasourceList<T[] | null> {
    
    const { data, error, pending, refresh } = useAsyncData<T[]>(options.fetch.url, () => $fetch(options.fetch.url, {
        headers: {
            Authorization: `Bearer ${session.token}`,
        },
    }))

    const datasource = data as DatasourceList<T[] | null>

    watch(error, (value: any) => {
        if (value) {
            hints.addError(value.data.message)
            hints.addError(options.fetch.error.message)
            options.fetch.error.handler?.()
        }
    })

    if (options.clear) {
        events.subscribe("switchedTenant", () => refresh())
    }

    datasource.fetch = async (): Promise<boolean> => {
        await refresh()
        return true
    }
    
    datasource.create = async <T>(items: T[]): Promise<boolean> => {
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
            hints.addError(options.create.error.message)
            options.create.error.handler?.(response.error.value)
            return false
        }
        else {
            return true
        }
    }
    
    datasource.update = async <T>(items: T[]): Promise<boolean> => {
        if (!options.update || items.length === 0) {
            return true
        }
    
        const response = await useAsyncData(() => $fetch(options.update!.url, {
            // TODO convert to PUT/PATCH
            method: "POST",
            headers: {
                Authorization: `Bearer ${session.token}`,
            },
            body: items,
        }))
    
        if (response.error.value) {
            hints.addError(options.update.error.message)
            options.update.error.handler?.(response.error.value)
            return false
        }
        else {
            return true
        }
    }
    
    datasource.remove = async <T>(items: T[]): Promise<boolean> => {
        if (!options.remove || items.length === 0) {
            return true
        }
    
        const response = await useAsyncData(() => $fetch(options.remove!.url, {
            // TODO convert to DELETE
            method: "POST",
            headers: {
                Authorization: `Bearer ${session.token}`,
            },
            body: items,
        }))
    
        if (response.error.value) {
            hints.addError(options.remove.error.message)
            options.remove.error.handler?.(response.error.value)
            return false
        }
        else {
            return true
        }
    }

    return datasource
    // return { items: data, options, loading: pending, fetch, create, update, remove }
}

// export default { createItem, createList }