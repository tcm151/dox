const session = getSession()

export const getId = (id: string) => {
    return id.split(':')[1];
}

export const useApi = async <T>(route: string, body?: any) => {
    return useFetch<T>(route, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${session.token}`,
        },
        body: body,
    })
}
