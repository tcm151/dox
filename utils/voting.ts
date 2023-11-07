import type { Voteable } from "~/types";

export const useVoting = () => {

    const hints = useHints();
    const session = getSession();

    async function positive(item: Voteable | null) {
        if (!session.isAuthenticated) {
            hints.addError("You must be logged in to interact with others.")
            return
        }

        if (!item) {
            hints.addError("You cannot vote on something that doesn't exist.")
            return
        }

        item.votes.misleading = item.votes.misleading.filter((id) => id !== session.user!.id)
        item.votes.negative = item.votes.negative.filter((id) => id !== session.user!.id)

        if (!item.votes.positive.includes(session.user!.id)) {
            item.votes.positive.push(session.user!.id)
            await session.useApi(`/api/vote/${item.id}/positive`)
        }
        else {
            item.votes.positive = item.votes.positive.filter((id) => id !== session.user!.id)
            await session.useApi(`/api/vote/${item.id}/reset`)
        }
    }

    async function misleading(item: Voteable | null) {
        if (!session.isAuthenticated) {
            hints.addError("You must be logged in to interact with others.")
            return
        }

        if (!item) {
            hints.addError("You cannot vote on something that doesn't exist.")
            return
        }

        item.votes.positive = item.votes.positive.filter((id) => id !== session.user!.id)
        item.votes.negative = item.votes.negative.filter((id) => id !== session.user!.id)
        
        if (!item.votes.misleading.includes(session.user!.id)) {
            item.votes.misleading.push(session.user!.id)
            await session.useApi(`/api/vote/${item.id}/misleading`)
        }
        else {
            item.votes.misleading = item.votes.misleading.filter((id) => id !== session.user!.id)
            await session.useApi(`/api/vote/${item.id}/reset`)
        }
    }
    
    async function negative(item: Voteable | null) {
        if (!session.isAuthenticated) {
            hints.addError("You must be logged in to interact with others.")
            return
        }

        if (!item) {
            hints.addError("You cannot vote on something that doesn't exist.")
            return
        }
        
        item.votes.positive = item.votes.positive.filter((id) => id !== session.user!.id)
        item.votes.misleading = item.votes.misleading.filter((id) => id !== session.user!.id)
        
        if (!item.votes.negative.includes(session.user!.id)) {
            item.votes.negative.push(session.user!.id)
            await session.useApi(`/api/vote/${item.id}/negative`)
        }
        else {
            item.votes.negative = item.votes.negative.filter((id) => id !== session.user!.id)
            await session.useApi(`/api/vote/${item.id}/reset`)
        }
        
    }

    return { positive, misleading, negative }
}