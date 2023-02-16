export interface Session {
    authenticated: boolean
    user: User | null
}

export interface Notification {
    recipient: User
    context: Post | Comment
    message: string
    time: string
    viewed: boolean
}

export interface User {
    id: string
    email: string
    name: string
    votes: Votes
    topics: string[]
    following: string[]
    followers: string[]
    dateCreated: string
}

export interface Votes {
    positive: string[]
    misleading: string[]
    negative: string[]
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
    edited?: boolean
    timeEdited?: string
}

export interface Comment {
    id: string
    time: string
    user: User
    post: Post
    replyTo: string
    content: string
    votes: Votes
    edited?: boolean
    timeEdited?: string
}