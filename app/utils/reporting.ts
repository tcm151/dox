export function submitReport(subject: string) {
    const valid = useValidation()
    const events = useEvents()

    if (!valid.record.id(subject)) {
        throw createError({
            status: 400,
            statusText: "Unable to report this."
        })
    }
    
    events.publish(Trigger.reportContent, subject)
}