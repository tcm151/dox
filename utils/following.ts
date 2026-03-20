
export const useFollowing = () => {

    const events = useEvents()
    const session = getSession()

    async function follow(target: string): Promise<boolean> {
        if (!session.isAuthenticated) {
            events.publish(Trigger.addHint, {
                message: "You must be logged into interact with others.",
                type: "error",
            })
            return false
        }
        
        if (target.startsWith("user")) {
            await session.useApi(`/api/user/${extractId(target)}/follow`)
            session.user.following.push(target)
        }
        if (target.startsWith("topic")) {
            await session.useApi(`/api/topic/${extractId(target)}/follow`)
            session.user.topics.push(target)
        }
        return true
    }
    
    async function unfollow(target: string): Promise<boolean> {
        if (!session.isAuthenticated) {
            events.publish(Trigger.addHint, {
                message: "You must be logged into interact with others.",
                type: "error",
            })
            return false
        }
        
        if (target.startsWith("user")) {
            await session.useApi(`/api/user/${extractId(target)}/unfollow`)
            session.user.following = session.user.following.filter(u => u !== target)
        }
        if (target.startsWith("topic")) {
            await session.useApi(`/api/topic/${extractId(target)}/unfollow`)
            session.user.topics = session.user.topics.filter(t => t !== target)
        }
        return true
    }

    return {
        follow,
        unfollow
    }
}

