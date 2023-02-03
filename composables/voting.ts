import { defineStore } from "pinia"
import { Votes } from "~/types/types";

export const useVoting = defineStore("voting", () => {

    const session = getSession();

    async function positive(id: string, votes: Votes) {
        if (!session.isAuthenticated) {
            // EventBus.publish("toggleModal", {
            //     title: "Not logged in",
            //     content: "Please login or create an account to interact with others",
            // })
            return
        }

        if (!votes.positive.includes(session.user!.id)) {
            votes.positive.push(session.user!.id)
        }
        if (votes.misleading.includes(session.user!.id)) {
            votes.misleading = votes.misleading.filter((id) => id !== session.user!.id)
        }
        if (votes.negative.includes(session.user!.id)) {
            votes.negative = votes.negative.filter((id) => id !== session.user!.id)
        }

        // TODO update database
        const { data: successful } = await useApi<Response>("/api/vote", {
            id: id,
            votes: votes
        })
        console.log(successful.value)
    }

    async function misleading(id: string, votes: Votes) {
        if (!session.isAuthenticated) {
            // EventBus.publish("toggleModal", {
            //     title: "Not logged in",
            //     content: "Please login or create an account to interact with others",
            // })
            return
        }

        if (votes.positive.includes(session.user!.id)) {
            votes.positive = votes.positive.filter((id) => id !== session.user!.id)
        }
        if (!votes.misleading.includes(session.user!.id)) {
            votes.misleading.push(session.user!.id)
        }
        if (votes.negative.includes(session.user!.id)) {
            votes.negative = votes.negative.filter((id) => id !== session.user!.id)
        }

        // TODO update database
        const { data: successful } = await useApi<Response>("/api/vote", {
            id: id,
            votes: votes
        })
        console.log(successful.value)
    }

    async function negative(id: string, votes: Votes) {
        if (!session.isAuthenticated) {
            // EventBus.publish("toggleModal", {
            //     title: "Not logged in",
            //     content: "Please login or create an account to interact with others",
            // })
            return
        }

        if (votes.positive.includes(session.user!.id)) {
            votes.positive = votes.positive.filter((id) => id !== session.user!.id)
        }
        if (votes.misleading.includes(session.user!.id)) {
            votes.misleading = votes.misleading.filter((id) => id !== session.user!.id)
        }
        if (!votes.negative.includes(session.user!.id)) {
            votes.negative.push(session.user!.id)
        }

        // TODO update database
        const { data: successful } = await useApi<Response>("/api/vote", {
            id: id,
            votes: votes
        })
        console.log(votes);
        console.log(successful.value)
    }

    return { positive, misleading, negative }
})