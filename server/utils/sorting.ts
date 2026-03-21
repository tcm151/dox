import type { Sortable } from "~/types"
import { DateTime } from "luxon"

export function sortList(items: Sortable[], sortType: string) {
    if (!items) return null
    
    return items.sort((first: Sortable, second: Sortable) => {
        switch (sortType) {
            case "new":
                return sortNew(first, second)
            case "top":
                return sortTop(first, second)
            case "hot":
                return sortHot(first, second)
            default:
                return 0
        }
    })
}

function sortNew(first: Sortable, second: Sortable) {
    const firstTime = DateTime.fromISO(first.time)
    const secondTime = DateTime.fromISO(second.time)
    return firstTime < secondTime ? 1 : -1
}

function sortTop(first: Sortable, second: Sortable) {
    if (first.score === second.score) {
        return sortNew(first, second)
    }
    else {
        return first.score < second.score ? 1 : -1
    }
}

function sortHot(first: Sortable, second: Sortable) {
    const now = DateTime.now()
    const firstDays = Math.max(1, now.diff(DateTime.fromISO(first.time), "days").days)
    const secondDays = Math.max(1, now.diff(DateTime.fromISO(second.time), "days").days)
    const firstAdjustedScore = first.score / (firstDays * (first.visits ?? 1))
    const secondAdjustedScore = second.score / (secondDays * (second.visits ?? 1))
    return firstAdjustedScore < secondAdjustedScore ? 1 : -1
}
