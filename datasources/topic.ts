import { defineStore } from "pinia";
import Datasource from "~/utils/datasource"
import { Post, Topic } from "~/types";

export const useTopic = (topic: string) => {
    return defineStore(`topic:${topic}`, () => {
        
        const hints = useHints()

        return {
            info: Datasource.defineItem<Topic>({
                fetch: {
                    url: () => `/api/topic/${topic}`,
                    error: {
                        message: `Failed to FETCH topic:${topic}`,
                        handler: (error: any) => {
                            hints.addError(error)
                        }
                    }
                },
            }),
            posts: Datasource.defineList<Post>({
                fetch: {
                    url: () => `/api/topic/${topic}/posts`,
                    error: {
                        message: `Failed to FETCH posts for topic:${topic}`,
                        handler: (error: any) => {
                            hints.addError(error)
                        }
                    }
                },
            }),
            followers: Datasource.defineItem<{ count: number }>({
                fetch: {
                    url: () => `/api/topic/${topic}/followers`,
                    error: {
                        message: `Failed to FETCH followers for topic:${topic}`,
                        handler: (error: any) => {
                            hints.addError(error)
                        }
                    }
                },
            })
        }
    })()
}