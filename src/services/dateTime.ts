// import moment from "moment"
import luxon from "luxon"

export function timeSince(dateTimeString: string | undefined) {
    if (dateTimeString == undefined) {
        return "\u221E ago"
    }
    const dateTime = luxon.DateTime.fromISO(dateTimeString)
    const minutesSince = dateTime.diffNow("minutes").minutes
    if (minutesSince < 60) {
        return `${minutesSince}m ago`
    }
    const hoursSince = dateTime.diffNow("hours").hours
    if (hoursSince < 24) {
        return `${hoursSince}h ago`
    }
    const daysSince = dateTime.diffNow("days").days
    if (daysSince < 7) {
        return `${daysSince}d ago`
    }
    const weeksSince = dateTime.diffNow("weeks").weeks
    if (weeksSince < 4) {
        return `${weeksSince}w ago`
    }
    const monthsSince = dateTime.diffNow("months").months
    if (monthsSince < 12) {
        return `${monthsSince}m ago`
    }
}
