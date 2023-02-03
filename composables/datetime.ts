export function formatDate(dateString: string): string {
    const ms = Date.parse(new Date().toISOString()) - Date.parse(dateString);
    const hours = ms / 1000 / 60 / 60;
    const days = hours / 24;
    const weeks = days / 7;
    const months = weeks / 4;
    const years = days / 365;
    if (days >= 365) {
        return `${(years).toFixed(0)}y ago`;
    }
    if (weeks >= 4) {
        return `${(months).toFixed(0)}m ago`;
    }
    if (days >= 7) {
        return `${(weeks).toFixed(0)}w ago`;
    }
    if (hours >= 24) {
        return `${(days).toFixed(0)}d ago`;
    }
    if (hours >= 1) {
        return `${hours.toFixed(0)}h ago`;
    }
    else {
        return '< 1h ago'
    }
}