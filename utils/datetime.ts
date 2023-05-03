import { DateTime, DurationUnit } from "luxon";

export function formatDate(dateString: string): string {
    
    const duration = DateTime.now().diff(DateTime.fromISO(dateString), [
        'minutes', 'hours', 'days', 'weeks', 'months', 'years'
    ])

    if (duration.years >= 1) {
        return `${duration.years.toFixed(0)}yr ago`;
    }
    if (duration.months >= 1) {
        return `${duration.months.toFixed(0)}mo ago`;
    }
    if (duration.weeks >= 1) {
        return `${duration.weeks.toFixed(0)}wk ago`;
    }
    if (duration.days >= 1) {
        return `${duration.days.toFixed(0)}d ago`;
    }
    if (duration.hours >= 1) {
        return `${duration.hours.toFixed(0)}h ago`;
    }
    if (duration.minutes >= 1) {
        return `${duration.minutes.toFixed(0)}m ago`;
    }
    else {
        return '< 1m ago'
    }
}

export function elapsedTime(time: string, units: DurationUnit) {
    return DateTime.now().diff(DateTime.fromISO(time), units)
}