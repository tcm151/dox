export function extractId(id: string | undefined) {
    if (!id || !id.includes(':')) {
        throw createError({
            status: 400,
            statusText: "Invalid ID provided."
        })
    }
    return id.split(':')[1]
}