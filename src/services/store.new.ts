import axios from "axios"
import { ref, computed } from "vue"
import { defineStore } from "pinia"
import { useLocalStorage } from "@vueuse/core"
import { Post, User } from "../api/types"
import EventBus from "../services/events"

export type Session = {
    authenticated: boolean
    user: User | null
    cache: Cache
}

export type Cache = {
    [key: string]: any
}

export const GetSession = defineStore("session", () => {
    const session = ref(
        useLocalStorage("session", {
            authenticated: false,
            user: null,
        } as Session)
    )

    const User = computed(() => session.value.user)
    const isAuthenticated = computed(() => session.value.authenticated)

    function login(newSession: Session) {
        session.value = newSession
    }

    function logout() {
        session.value.authenticated = false
        session.value.user = null
    }

    function updateTopics(topics: string[]): void {
        session.value.user!.topics = topics
    }

    function get(key: string) {
        return session.value.cache[key]
    }

    function set(key: string, value: any) {
        session.value.cache[key] = value
    }

    function upvote(post: Post) {
        if (!session.value.authenticated) {
            EventBus.publish("toggleModal", {
                title: "Not logged in",
                content: "Please login or create an account to interact with others",
            })
            return
        }

        if (!post.votes.upvotes.includes(session.value.user!.user_id)) post.votes.upvotes.push(session.value.user!.user_id)
        if (post.votes.misleading.includes(session.value.user!.user_id))
            post.votes.misleading = post.votes.misleading.filter((id) => id !== session.value.user!.user_id)
        if (post.votes.downvotes.includes(session.value.user!.user_id))
            post.votes.downvotes = post.votes.downvotes.filter((id) => id !== session.value.user!.user_id)

        axios.patch(
            `https://doxforeverything.herokuapp.com/posts/${post.post_id}/votes`,
            new URLSearchParams({ votes: JSON.stringify(post.votes) })
        )
    }

    function misleading(post: Post) {
        if (!session.value.authenticated) {
            EventBus.publish("toggleModal", {
                title: "Not logged in",
                content: "Please login or create an account to interact with others",
            })
            return
        }

        if (post.votes.upvotes.includes(session.value.user!.user_id))
            post.votes.upvotes = post.votes.upvotes.filter((id) => id !== session.value.user!.user_id)
        if (!post.votes.misleading.includes(session.value.user!.user_id))
            post.votes.misleading.push(session.value.user!.user_id)
        if (post.votes.downvotes.includes(session.value.user!.user_id))
            post.votes.downvotes = post.votes.downvotes.filter((id) => id !== session.value.user!.user_id)

        axios.patch(
            `https://doxforeverything.herokuapp.com/posts/${post.post_id}/votes`,
            new URLSearchParams({ votes: JSON.stringify(post.votes) })
        )
    }

    function downvote(post: Post) {
        if (!session.value.authenticated) {
            EventBus.publish("toggleModal", {
                title: "Not logged in",
                content: "Please login or create an account to interact with others",
            })
            return
        }

        if (post.votes.upvotes.includes(session.value.user!.user_id))
            post.votes.upvotes = post.votes.upvotes.filter((id) => id !== session.value.user!.user_id)
        if (post.votes.misleading.includes(session.value.user!.user_id))
            post.votes.misleading = post.votes.misleading.filter((id) => id !== session.value.user!.user_id)
        if (!post.votes.downvotes.includes(session.value.user!.user_id))
            post.votes.downvotes.push(session.value.user!.user_id)

        axios.patch(
            `https://doxforeverything.herokuapp.com/posts/${post.post_id}/votes`,
            new URLSearchParams({ votes: JSON.stringify(post.votes) })
        )
    }

    return {
        session,
        User,
        isAuthenticated,
        login,
        logout,
        updateTopics,
        upvote,
        misleading,
        downvote,
        get,
        set,
    }
})
