import type { Voteable } from "@@/shared/types"

type Vote = "positive" | "misleading" | "negative"

export const useVoting = () => {

    const hints = useHints()
    const session = getSession()
    const types: Vote[] = ["positive", "misleading", "negative"]

    async function submit(type: Vote, item: Voteable) {
        if (!session.isAuthenticated) {
            hints.addError("You must be logged in to interact with others.")
            return
        }

        for (let other of types.filter(t => t != type)) {
            item.votes[other] = item.votes[other].filter(u => u !== session.user.id)
        }

        if (!item.votes[type].includes(session.user.id)) {
            item.votes[type].push(session.user.id)
            await useApi(`/api/vote/${item.id}/${type}`)
        }
        else {
            item.votes[type] = item.votes[type].filter(u => u !== session.user.id)
            await useApi(`/api/vote/${item.id}/reset`)
        }
    }

    async function positive(item: Voteable) {
        await submit("positive", item)
    }

    async function misleading(item: Voteable) {
        await submit("misleading", item)
    }
    
    async function negative(item: Voteable) {
        await submit("negative", item)
    }

    return {
        submit,
        positive,
        misleading,
        negative
    }
}