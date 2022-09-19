// import moment from "moment"
import * as luxon from "luxon"

export function timeSince(dateTimeString: string | undefined) {
    if (dateTimeString == undefined) {
        return "\u221E ago"
    }
    const now = luxon.DateTime.now()
    const dateTime = luxon.DateTime.fromISO(dateTimeString)
    const secondsSince = now.diff(dateTime, "seconds").seconds
    if (secondsSince < 60) {
        return `${secondsSince.toFixed(0)} seconds ago`
    }
    const minutesSince = now.diff(dateTime, "minutes").minutes
    if (minutesSince < 60) {
        return `${minutesSince.toFixed(0)} mins ago`
    }
    const hoursSince = now.diff(dateTime, "hours").hours
    if (hoursSince < 24) {
        return `${hoursSince.toFixed(0)} hours ago`
    }
    const daysSince = now.diff(dateTime, "days").days
    if (daysSince < 7) {
        return `${daysSince.toFixed(0)} days ago`
    }
    const weeksSince = now.diff(dateTime, "weeks").weeks
    if (weeksSince < 4) {
        return `${weeksSince.toFixed(0)} weeks ago`
    }
    const monthsSince = now.diff(dateTime, "months").months
    if (monthsSince < 12) {
        return `${monthsSince.toFixed(0)} months ago`
    }
    const yearsSince = now.diff(dateTime, "years").years
    return `${yearsSince.toFixed(0)} years ago`
}
