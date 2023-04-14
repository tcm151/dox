import { DateTime } from "luxon"
import { Post, Comment, Voteable } from "~/types"

export function sortBy(list: Post[] | Comment[] | null, sortType: string) {
    if (!list) {
        return null
    }
    
    return list.sort((first: Post | Comment, second: Post | Comment) => {
        switch (sortType) {
            case "new":
                return sortNew(first, second);
            case "top":
                return sortTop(first, second);
            case "hot":
                return sortHot(first, second);
            default:
                return 0;
        }
    })
}
    
function sortNew(first: Post | Comment, second: Post | Comment) {
    const firstTime = DateTime.fromISO(first.time)
    const secondTime = DateTime.fromISO(second.time)
    return firstTime < secondTime ? 1 : -1
}

function sortTop(first: Post | Comment, second: Post | Comment) {
    const firstScore = calculateScore(first);
    const secondScore = calculateScore(second);
    if (firstScore === secondScore) return sortNew(first, second)
    return firstScore < secondScore ? 1 : -1
}

function sortHot(first: Post | Comment, second: Post | Comment) {
    const timeSinceFirst = DateTime.now().diff(DateTime.fromISO(first.time), "days").days
    const timeSinceSecond = DateTime.now().diff(DateTime.fromISO(second.time), "days").days
    const firstScore = calculateScore(first) / (timeSinceFirst + 1)
    const secondScore = calculateScore(second) / (timeSinceSecond + 1)
    return firstScore < secondScore ? 1 : -1
}

function calculateScore(item: Voteable) {
    return item.votes.positive.length - item.votes.negative.length - (item.votes.misleading.length / 2);
}

