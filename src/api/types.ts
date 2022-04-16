//- metadata datatype
export interface Metadata {
    type: string
    [key: string]: any
}

//- user datatype
export interface User {
    user_id: number
    email: string
    username: string
    password: string
    // following: number[]
    // followers: number[]
    // posts?: Post[],
    // comments?: Comment[],
}

//- post datatype
export interface Post {
    post_id: number
    user_id: number
    user?: User
    title: string
    content: string
    votes: Votes
    time: string
    topics: string[]
}

//- comment datatype
export interface Comment {
    comment_id: number
    user_id: number
    user?: User
    post_id: number
    post?: Post
    reply_to: number
    content: string
    votes: Votes
    time: string
}

export interface Votes {
    upvotes: number
    misleading: number
    downvotes: number
    users: number[]
}
