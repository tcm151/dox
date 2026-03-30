export async function submitReport(subject: string) {
    const hints = useHints()
    const valid = useValidation()

    if (!valid.record.id(subject)) {
        throw createError({
            status: 400,
            statusText: "Unable to report this."
        })
    }
    
    await useApi("/api/report/send", {
        body: {
            subject: subject
        }
    })
    
    hints.addError("Thank you for reporting this to the development team.")
}