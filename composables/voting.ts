import { defineStore } from "pinia"
import { Votes } from "~/types/types";

export const useVoting = defineStore("voting", () => {

    const session = getSession();

    function upvote(votes: Votes) {
        if (!session.isAuthenticated) {
            // EventBus.publish("toggleModal", {
            //     title: "Not logged in",
            //     content: "Please login or create an account to interact with others",
            // })
            return
        }

        if (!votes.upvotes.includes(session.user!.id)) {
            votes.upvotes.push(session.user!.id)
        }
        if (votes.misleading.includes(session.user!.id)) {
            votes.misleading = votes.misleading.filter((id) => id !== session.user!.id)
        }
        if (votes.downvotes.includes(session.user!.id)) {
            votes.downvotes = votes.downvotes.filter((id) => id !== session.user!.id)
        }

        // TODO update database
    }

    function misleading(votes: Votes) {
        if (!session.isAuthenticated) {
            // EventBus.publish("toggleModal", {
            //     title: "Not logged in",
            //     content: "Please login or create an account to interact with others",
            // })
            return
        }

        if (votes.upvotes.includes(session.user!.id)) {
            votes.upvotes = votes.upvotes.filter((id) => id !== session.user!.id)
        }
        if (!votes.misleading.includes(session.user!.id)) {
            votes.misleading.push(session.user!.id)
        }
        if (votes.downvotes.includes(session.user!.id)) {
            votes.downvotes = votes.downvotes.filter((id) => id !== session.user!.id)
        }

        // TODO update database
    }

    function downvote(votes: Votes) {
        if (!session.isAuthenticated) {
            // EventBus.publish("toggleModal", {
            //     title: "Not logged in",
            //     content: "Please login or create an account to interact with others",
            // })
            return
        }

        if (votes.upvotes.includes(session.user!.id)) {
            votes.upvotes = votes.upvotes.filter((id) => id !== session.user!.id)
        }
        if (votes.misleading.includes(session.user!.id)) {
            votes.misleading = votes.misleading.filter((id) => id !== session.user!.id)
        }
        if (!votes.downvotes.includes(session.user!.id)) {
            votes.downvotes.push(session.user!.id)
        }

        // TODO update database
    }

    return { upvote, misleading, downvote }
})