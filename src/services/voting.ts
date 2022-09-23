import axios from "axios"
import { Post } from "../api/types"
import { store } from "./store"

export function upvote(post: Post) {
    if (!store.state.session.authenticated) {
        toggleModal("You must be logged in to vote", "Please login or create an account to interact with others")
        return
    }

    if (!post.votes.upvotes.includes(store.getters.getCurrentUserId)) post.votes.upvotes.push(store.getters.getCurrentUserId)
    if (post.votes.misleading.includes(store.getters.getCurrentUserId))
        post.votes.misleading = post.votes.misleading.filter((id) => id !== store.getters.getCurrentUserId)
    if (post.votes.downvotes.includes(store.getters.getCurrentUserId))
        post.votes.downvotes = post.votes.downvotes.filter((id) => id !== store.getters.getCurrentUserId)

    axios.patch(
        `https://doxforeverything.herokuapp.com/posts/${post.post_id}/votes`,
        new URLSearchParams({ votes: JSON.stringify(post.votes) })
    )
}
export function misleading(post: Post) {
    if (!store.state.session.authenticated) {
        toggleModal("You must be logged in to vote", "Please login or create an account to interact with others")
        return
    }

    if (post.votes.upvotes.includes(store.getters.getCurrentUserId))
        post.votes.upvotes = post.votes.upvotes.filter((id) => id !== store.getters.getCurrentUserId)
    if (!post.votes.misleading.includes(store.getters.getCurrentUserId))
        post.votes.misleading.push(store.getters.getCurrentUserId)
    if (post.votes.downvotes.includes(store.getters.getCurrentUserId))
        post.votes.downvotes = post.votes.downvotes.filter((id) => id !== store.getters.getCurrentUserId)

    axios.patch(
        `https://doxforeverything.herokuapp.com/posts/${post.post_id}/votes`,
        new URLSearchParams({ votes: JSON.stringify(post.votes) })
    )
}
export function downvote(post: Post) {
    if (!store.state.session.authenticated) {
        toggleModal("You must be logged in to vote", "Please login or create an account to interact with others")
        return
    }

    if (post.votes.upvotes.includes(store.getters.getCurrentUserId))
        post.votes.upvotes = post.votes.upvotes.filter((id) => id !== store.getters.getCurrentUserId)
    if (post.votes.misleading.includes(store.getters.getCurrentUserId))
        post.votes.misleading = post.votes.misleading.filter((id) => id !== store.getters.getCurrentUserId)
    if (!post.votes.downvotes.includes(store.getters.getCurrentUserId))
        post.votes.downvotes.push(store.getters.getCurrentUserId)

    axios.patch(
        `https://doxforeverything.herokuapp.com/posts/${post.post_id}/votes`,
        new URLSearchParams({ votes: JSON.stringify(post.votes) })
    )
}
function toggleModal(arg0: string, arg1: string) {
    throw new Error("Function not implemented.")
}
