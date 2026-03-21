export async function submitReport(subject: string) {
    const hints = useHints()
    const session = getSession()

    const [table, id] = subject.toString().split(":", 2)
    if (!table || !id) {
        throw createError({
            status: 400,
            statusText: "Unable to report this."
        })
    }
    
    await session.useApi("/api/report/send", { subject })
    hints.addError("Thank you for reporting this to the development team.")
}