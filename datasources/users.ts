import { createDatasourceList } from "~/services/datasource"
import { defineStore } from "pinia";
import { Post } from "~/types";

export const useFeed = defineStore("feed", () => {
    return createDatasourceList<Post>({
        clear: true,
        fetch: {
            url: `/api/post?page=1&pageSize=25`,
            error: {
                message: `Failed to FETCH users from server`
            }
        },
        create: {
            url: `/api/post/add`,
            error: {
                message: `Failed to CREATE user :(`
            }
        },
    })
})


// export const useSandboxUsers = defineStore("sandboxUsers", () => {
//     return Datasource.createList<Sandbox.User>({
//         clear: false,
//         fetch: {
//             url: `/api/admin/users`,
//             error: {
//                 message: `Failed to FETCH users from server`
//             }
//         },
//         create: {
//             url: `/api/admin/users/add`,
//             error: {
//                 message: `Failed to CREATE user :(`
//             }
//         },
//         update: {
//             url: `/api/admin/users/update`,
//             error: {
//                 message: `Failed to UPDATE user :(`
//             }
//         },
//         remove: {
//             url: `/api/admin/users/remove`,
//             error: {
//                 message: `Failed to REMOVE user :(`
//             }
//         }
//     })
// })