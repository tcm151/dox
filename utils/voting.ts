import type { Voteable } from "~/types"

type Vote = "positive" | "misleading" | "negative"

export const useVoting = () => {

    const hints = useHints()
    const session = getSession()
    const types: Vote[] = ["positive", "misleading", "negative"]

    async function updateVote(item: Voteable, type: Vote) {
        if (!session.isAuthenticated) {
            hints.addError("You must be logged in to interact with others.")
            return
        }

        for (let other of types.filter(t => t != type)) {
            item.votes[other] = item.votes[type].filter(u => u !== session.user.id)
        }

        if (!item.votes[type].includes(session.user.id)) {
            item.votes[type].push(session.user.id)
            await session.useApi(`/api/vote/${item.id}/${type}`)
        }
        else {
            item.votes[type] = item.votes[type].filter(u => u !== session.user.id)
            await session.useApi(`/api/vote/${item.id}/reset`)
        }
    }

    async function positive(item: Voteable) {
        updateVote(item, "positive")
    }

    async function misleading(item: Voteable) {
        updateVote(item, "misleading")
    }
    
    async function negative(item: Voteable) {
        updateVote(item, "negative")
    }

    return {
        positive,
        misleading,
        negative
    }
}