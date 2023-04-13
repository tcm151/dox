import { defineStore } from "pinia";
import Datasource from "~/utils/datasource"
import { Post } from "~/types";

interface QueryParameters {
    pageNumber: number
    pageSize: number
}

export const useFeed = (query: QueryParameters) => {
    return defineStore("feed", () => {
        
        const hints = useHints()

        return Datasource.defineList<Post>({
            fetch: {
                url: () => `/api/post?page=${query.pageNumber}&pageSize=${query.pageSize}`,
                error: {
                    message: `Failed to FETCH users from server`,
                    handler: (error: any) => {
                        hints.addError("Failed to load posts.")
                        hints.addError(error.message)
                    }
                }
            },
            create: {
                url: `/api/post/add`,
                error: {
                    message: `Failed to CREATE post :(`
                }
            },
        })
    })()
}