const hints = useHints();
const session = getSession()

export const getId = (id: string | undefined) => {
    return id?.split(':')[1] ?? "null";
}

export const useApi = async <T>(route: string, body?: any) => {
    try {
        return await $fetch<T>(route, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${session.readToken()}`,
            },
            body: body,
        })
    }
    catch (ex) {
        hints.addError("Failed to authenticate session.");
        clearError();
    }
}
