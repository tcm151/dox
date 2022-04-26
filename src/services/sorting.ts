import { DateTime } from "luxon"
import { Post, Comment } from "../api/types"

export function sortPosts(postList: Post[], sortType: string): Post[] {
    return postList.sort((first: Post, second: Post) => {
        if (sortType == "new") return sortNew(first, second)
        else if (sortType == "top") return sortTop(first, second)
        else if (sortType == "hot") return sortHot(first, second)
        else return 0
    })
}

function sortNew(p1: Post, second: Post) {
    const firstTime = DateTime.fromISO(p1.time)
    const secondTime = DateTime.fromISO(second.time)
    return firstTime < secondTime ? 1 : -1
}

function sortTop(first: Post, second: Post) {
    const firstScore = first.votes.upvotes.length - first.votes.downvotes.length - first.votes.misleading.length / 2
    const secondScore = second.votes.upvotes.length - second.votes.downvotes.length - second.votes.misleading.length / 2
    if (firstScore === secondScore) return sortNew(first, second)
    return firstScore < secondScore ? 1 : -1
}

function sortHot(first: Post, second: Post) {
    const timeSinceFirst = DateTime.now().diff(DateTime.fromISO(first.time), "days").days
    const timeSinceSecond = DateTime.now().diff(DateTime.fromISO(second.time), "days").days
    const firstScore =
        (first.votes.upvotes.length - first.votes.downvotes.length - first.votes.misleading.length / 2) /
        (timeSinceFirst + 1)
    console.log(firstScore)
    const secondScore =
        (second.votes.upvotes.length - second.votes.downvotes.length - second.votes.misleading.length / 2) /
        (timeSinceSecond + 1)
    console.log(secondScore)
    return firstScore < secondScore ? 1 : -1
}

export function sortComments(commentList: Post[], sortType: string): Post[] {
    return commentList
}
