export default defineEventHandler(async (event) => {
    throw createError({
        status: 400,
        statusText: "There is nothing here."
    })
})