import { Votes } from "~/types";

export const useVoting = () => {

    const hints = useHints();
    const session = getSession();

    async function positive(id: string, votes: Votes) {
        if (!session.isAuthenticated) {
            hints.addError("You must be logged in to interact with others.")
            return
        }

        if (!votes.positive.includes(session.user!.id)) {
            votes.positive.push(session.user!.id)
        }
        else {
            votes.positive = votes.positive.filter((id) => id !== session.user!.id)
        }

        if (votes.misleading.includes(session.user!.id)) {
            votes.misleading = votes.misleading.filter((id) => id !== session.user!.id)
        }
        if (votes.negative.includes(session.user!.id)) {
            votes.negative = votes.negative.filter((id) => id !== session.user!.id)
        }

        await session.useApi("/api/vote", {
            id: id,
            votes: votes
        })
    }

    async function misleading(id: string, votes: Votes) {
        if (!session.isAuthenticated) {
            hints.addError("You must be logged in to interact with others.")
            return
        }

        if (!votes.misleading.includes(session.user!.id)) {
            votes.misleading.push(session.user!.id)
        }
        else {
            votes.misleading = votes.misleading.filter((id) => id !== session.user!.id)
        }

        if (votes.positive.includes(session.user!.id)) {
            votes.positive = votes.positive.filter((id) => id !== session.user!.id)
        }
        if (votes.negative.includes(session.user!.id)) {
            votes.negative = votes.negative.filter((id) => id !== session.user!.id)
        }

        await session.useApi("/api/vote", {
            id: id,
            votes: votes
        })
    }

    async function negative(id: string, votes: Votes) {
        if (!session.isAuthenticated) {
            hints.addError("You must be logged in to interact with others.")
            return
        }

        if (!votes.negative.includes(session.user!.id)) {
            votes.negative.push(session.user!.id)
        }
        else {
            votes.negative = votes.negative.filter((id) => id !== session.user!.id)
        }

        if (votes.positive.includes(session.user!.id)) {
            votes.positive = votes.positive.filter((id) => id !== session.user!.id)
        }
        if (votes.misleading.includes(session.user!.id)) {
            votes.misleading = votes.misleading.filter((id) => id !== session.user!.id)
        }

        await session.useApi("/api/vote", {
            id: id,
            votes: votes
        })
    }

    return { positive, misleading, negative }
}