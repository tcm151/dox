export interface Session {
    authenticated: boolean
    token: string
    user: User | null
}

export interface User {
    id: string
    email: string
    name: string
    // password?: string
    topics: string[]
    following: string[]
    followers: string[]
}

export interface Votes {
    upvotes: string[]
    misleading: string[]
    downvotes: string[]
}

export interface Post {
    id: string
    time: string
    user: User
    title: string
    content: string
    votes: Votes
    topics: string[]
    comments: string[]
}

export interface Comment {
    id: string
    time: string
    user: User
    post: Post
    replyTo: string
    content: string
    votes: Votes
}