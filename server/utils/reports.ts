import type { Report } from "@@/shared/types"

export async function cleanReports() {
    await new DatabaseQuery()
        .addSql(`
            DELETE report
            WHERE !record::exists(subject);
        `)
        .execute()
}

export async function createReport(subject: string, reporter: string, reason: unknown): Promise<void> {
    const normalizedReason = typeof reason === "string" ? reason.trim() : ""
    if (!normalizedReason) {
        throw createError({ status: 400, statusText: "A report reason is required." })
    }

    try {
        await new DatabaseQuery()
            .addSql(`
                UPSERT report SET
                    subject = $subject,
                    complaints += { reporter: $reporter, reason: $reason, time: time::now() },
                    time = time::now(),
                    status = "pending",
                    resolution = NONE
                WHERE subject = $subject
                RETURN AFTER;
            `)
            .addRecord("subject", subject)
            .addRecord("reporter", reporter)
            .addParameter("reason", normalizedReason)
            .execute()
    } catch (e: any) {
        console.error(e)
        throw createError({ status: 500, statusText: e.message ?? e.toString() })
    }

}