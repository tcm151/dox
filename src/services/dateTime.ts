// import moment from "moment"
import * as luxon from "luxon"

export function timeSince(dateTimeString: string | undefined) {
    if (dateTimeString == undefined) {
        return "\u221E ago"
    }
    const now = luxon.DateTime.now()
    const dateTime = luxon.DateTime.fromISO(dateTimeString)
    const minutesSince = now.diff(dateTime, "minutes").minutes
    if (minutesSince < 60) {
        // console.log(minutesSince)
        return `${minutesSince.toFixed(0)}m ago`
    }
    const hoursSince = now.diff(dateTime, "hours").hours
    if (hoursSince < 24) {
        // console.log(hoursSince)
        return `${hoursSince.toFixed(0)}h ago`
    }
    const daysSince = now.diff(dateTime, "days").days
    if (daysSince < 7) {
        // console.log(daysSince)
        return `${daysSince.toFixed(0)}d ago`
    }
    const weeksSince = now.diff(dateTime, "weeks").weeks
    if (weeksSince < 4) {
        return `${weeksSince.toFixed(0)}w ago`
    }
    const monthsSince = now.diff(dateTime, "months").months
    if (monthsSince < 12) {
        return `${monthsSince.toFixed(0)}m ago`
    }
}
