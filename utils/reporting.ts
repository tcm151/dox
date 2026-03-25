export async function submitReport(subject: string) {
    const hints = useHints()

    const [table, id] = subject.toString().split(":", 2)
    if (!table || !id) {
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