import { DateTime } from "luxon"
import type { Voteable } from "~/types"

interface Sortable extends Voteable {
    time: string
}

export function sortBy(items: Sortable[], sortType: string) {
    if (!items) {
        return null
    }
    
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
    if (first.votes.score === second.votes.score) {
        return sortNew(first, second)
    }
    else {
        return first.votes.score < second.votes.score ? 1 : -1
    }
}

function sortHot(first: Sortable, second: Sortable) {
    const daysSinceFirst = DateTime.now().diff(DateTime.fromISO(first.time), "days").days
    const daysSinceSecond = DateTime.now().diff(DateTime.fromISO(second.time), "days").days
    const firstAdjustedScore = first.votes.score / (daysSinceFirst + 1)
    const secondAdjustedScore = second.votes.score / (daysSinceSecond + 1)
    return firstAdjustedScore < secondAdjustedScore ? 1 : -1
}

