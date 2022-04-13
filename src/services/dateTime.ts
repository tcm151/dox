import moment from "moment"

export function timeSince(dateTime: string) {
    const minutesSince = moment().diff(dateTime, "minutes")
    if (minutesSince <= 60) {
        return `${minutesSince}m ago`
    }
    const hoursSince = moment().diff(dateTime, "hours")
    if (hoursSince <= 24) {
        return `${hoursSince}h ago`
    }
    const daysSince = moment().diff(dateTime, "days")
    if (daysSince <= 7) {
        return `${daysSince}d ago`
    }
    const weeksSince = moment().diff(dateTime, "weeks")
    if (weeksSince <= 4) {
        return `${weeksSince}w ago`
    }
    const monthsSince = moment().diff(dateTime, "months")
    if (monthsSince <= 4) {
        return `${monthsSince}m ago`
    }
}
