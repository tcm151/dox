import { DateTime } from "luxon"
import { Post, Comment, Votes } from "~/types/types"

export const useSorting = () => {

    function sortBy(list: Post[] | Comment[], sortType: string): Post[] | Comment[] {
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
        const firstScore = calculateScore(first.votes);
        const secondScore = calculateScore(second.votes);
        if (firstScore === secondScore) return sortNew(first, second)
        return firstScore < secondScore ? 1 : -1
    }
    
    function sortHot(first: Post | Comment, second: Post | Comment) {
        const timeSinceFirst = DateTime.now().diff(DateTime.fromISO(first.time), "days").days
        const timeSinceSecond = DateTime.now().diff(DateTime.fromISO(second.time), "days").days
        const firstScore = calculateScore(first.votes) / (timeSinceFirst + 1)
        const secondScore = calculateScore(second.votes) / (timeSinceSecond + 1)
        return firstScore < secondScore ? 1 : -1
    }
    
    function calculateScore(votes: Votes) {
        return votes.positive.length - votes.negative.length - (votes.misleading.length / 2);
    }

    return { sortBy }
}
