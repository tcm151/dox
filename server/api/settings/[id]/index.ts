export default defineEventHandler(async (event) => {
    const { id } = event.context.params!
    return await SettingsManager.get(id)
})