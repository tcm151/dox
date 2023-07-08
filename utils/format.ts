import { DateTime } from "luxon";


export type Format = "currency" | "percentage" | "date-short" | "date-medium" | "date-long" | "datetime" | "time" | undefined

export const formatAs = (type: Format, value: any) => {
    switch (type) {
        case "date-short":
            return DateTime.fromISO(value).toLocaleString(DateTime.DATE_SHORT);
        case "date-medium":
            return DateTime.fromISO(value).toLocaleString(DateTime.DATE_MED);
        case "date-long":
            return DateTime.fromISO(value).toLocaleString(DateTime.DATE_HUGE);
        case "datetime":
            return DateTime.fromISO(value).toLocaleString(DateTime.DATETIME_MED);
        case "time":
            return DateTime.fromISO(value).toLocaleString(DateTime.TIME_SIMPLE);
        case 'currency':
            return Intl.NumberFormat('en-US', { style: 'currency', currency: 'CAD', currencyDisplay: 'narrowSymbol'}).format(value);
        case 'percentage':
            return Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
        case undefined:
        default:
            return value;
    }
}