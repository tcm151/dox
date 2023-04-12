export default defineEventHandler(async (event) => {
    throw createError({
        statusCode: 400,
        statusMessage: "There is nothing here."
    })
})