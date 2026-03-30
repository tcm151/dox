
export const useFollowing = () => {

    const events = useEvents()
    const session = getSession()

    async function follow(target: string): Promise<boolean> {
        if (!session.isAuthenticated) {
            events.publish(Trigger.addHint, {
                type: "error",
                message: "You must be logged into interact with others.",
            })
            return false
        }
        
        if (target.startsWith("user")) {
            await useApi(`/api/user/${extractId(target)}/follow`)
            session.user.following.push(target)
        }
        if (target.startsWith("topic")) {
            await useApi(`/api/topic/${extractId(target)}/follow`)
            session.user.topics.push(target)
        }
        return true
    }
    
    async function unfollow(target: string): Promise<boolean> {
        if (!session.isAuthenticated) {
            events.publish(Trigger.addHint, {
                type: "error",
                message: "You must be logged into interact with others.",
            })
            return false
        }
        
        if (target.startsWith("user")) {
            await useApi(`/api/user/${extractId(target)}/unfollow`)
            session.user.following = session.user.following.filter(u => u !== target)
        }
        if (target.startsWith("topic")) {
            await useApi(`/api/topic/${extractId(target)}/unfollow`)
            session.user.topics = session.user.topics.filter(t => t !== target)
        }
        return true
    }

    return {
        follow,
        unfollow
    }
}

