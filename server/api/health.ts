export default defineEventHandler(async (event) => {
    return useHealth().healthReport(event)
})