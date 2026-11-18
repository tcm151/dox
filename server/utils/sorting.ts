import { DateTime } from "luxon"
import type { Sortable } from "@@/shared/types"

type SortableListItem = Pick<Sortable, "time" | "score">

export function sortList<T extends SortableListItem>(items: T[], sortType: string): T[] {
    return items.sort((first, second) => {
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

function sortNew(first: SortableListItem, second: SortableListItem) {
    const firstTime = DateTime.fromISO(first.time)
    const secondTime = DateTime.fromISO(second.time)
    return firstTime < secondTime ? 1 : -1
}

function sortHot(first: SortableListItem, second: SortableListItem) {
    const now = DateTime.now()
    const firstDays = Math.max(1, now.diff(DateTime.fromISO(first.time), "hours").hours)
    const secondDays = Math.max(1, now.diff(DateTime.fromISO(second.time), "hours").hours)
    const firstHotness = first.score / (firstDays * firstDays)
    const secondHotness = second.score / (secondDays * secondDays)
    return firstHotness < secondHotness ? 1 : -1
}

function sortTop(first: SortableListItem, second: SortableListItem) {
    if (first.score === second.score) {
        return sortNew(first, second)
    }
    else {
        return first.score < second.score ? 1 : -1
    }
}