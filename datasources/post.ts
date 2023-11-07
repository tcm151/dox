import { defineStore } from "pinia";
import Datasource from "~/utils/datasource"
import type { Post, Comment } from "~/types";

export const usePost = (id: string) => {
    return defineStore(`post:${id}`, () => {
        
        const hints = useHints()

        return {
            post: Datasource.defineItem<Post>({
                fetch: {
                    url: () => `/api/post/${id}`,
                    error: {
                        message: `Failed to FETCH post:${id}`,
                        handler: (error: any) => {
                            hints.addError(error.message)
                        }
                    }
                },
            }),
            comments: Datasource.defineList<Comment>({
                fetch: {
                    url: () => `/api/post/${id}/comments`,
                    error: {
                        message: `Failed to FETCH comments for post:${id}`,
                        handler: (error: any) => {
                            hints.addError(error.message)
                        }
                    }
                },
            })
        }
    })()
}