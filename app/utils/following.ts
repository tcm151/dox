
export const useFollowing = () => {

    const events = useEvents()
    const session = getSession()

    async function follow(target: string): Promise<boolean> {
        if (!session.isAuthenticated) {
            events.publish(Trigger.addHint, {
                type: "warning",
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
            session.user.topics.following.push(target)
        }
        return true
    }
    
    async function unfollow(target: string): Promise<boolean> {
        if (!session.isAuthenticated) {
            events.publish(Trigger.addHint, {
                type: "warning",
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
            session.user.topics.following = session.user.topics.following.filter(t => t !== target)
        }
        return true
    }

    return {
        follow,
        unfollow
    }
}

