export function extractId(id: string | undefined) {
    if (!id || !id.includes(':')) {
        throw createError({
            statusCode: 400,
            message: "Invalid ID provided."
        })
    }
    return id.split(':')[1]
}