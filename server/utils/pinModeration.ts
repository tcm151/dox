import type { Moderation, Pin } from "@@/shared/types"

export async function attachPinModeration(pins: Pin[]): Promise<Pin[]> {
    const threadPins = pins.filter(pin => pin.item.id.startsWith("thread:"))
    if (threadPins.length === 0) return pins

    const controls = await new DatabaseQuery()
        .addSql(`SELECT subject, locked, slowed FROM moderation WHERE subject IN $subjects;`)
        .addRecords("subjects", threadPins.map(pin => pin.item.id))
        .queryAll<Pick<Moderation, "subject" | "locked" | "slowed">>()

    const controlsBySubject = new Map<string, Pick<Moderation, "locked" | "slowed">>()
    for (const control of controls) {
        controlsBySubject.set(control.subject, { locked: control.locked, slowed: control.slowed })
    }

    const threadPinIds = new Set(threadPins.map(pin => pin.item.id))
    return pins.map((pin) => {
        if (!threadPinIds.has(pin.item.id)) return pin

        const moderation = controlsBySubject.get(pin.item.id)
        return moderation
            ? { ...pin, item: { ...pin.item, moderation } }
            : pin
    })
}