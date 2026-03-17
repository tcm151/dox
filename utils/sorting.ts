import { DateTime } from "luxon"
import type { Voteable } from "~/types"

export interface Sortable extends Voteable {
    time: string
    visits?: number
}

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
    const firstRanking = first.votes.score * (first.visits ?? 1)
    const secondRanking = second.votes.score * (second.visits ?? 1)
    if (firstRanking === secondRanking) {
        return sortNew(first, second)
    }
    else {
        return firstRanking < secondRanking ? 1 : -1
    }
}

function sortHot(first: Sortable, second: Sortable) {
    const now = DateTime.now()
    const firstDays = now.diff(DateTime.fromISO(first.time), "days").days
    const secondDays = now.diff(DateTime.fromISO(second.time), "days").days
    const firstAdjustedScore = first.votes.score * (first.visits ?? 1) / (firstDays * (first.visits ?? 1))
    const secondAdjustedScore = second.votes.score * (second.visits ?? 1) / (secondDays * (second.visits ?? 1))
    return firstAdjustedScore < secondAdjustedScore ? 1 : -1
}
