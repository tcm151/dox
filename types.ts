export interface User {
    id: string
    email: string
    name: string
    votes: Votes
    topics: string[]
    following: string[]
    followers: string[]
    dateCreated: string
    admin: boolean
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

export interface Draft {
    id: string
    time: string
    user: User
    title: string
    content: string
    topics: string[]
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

export interface Notification {
    id: string
    recipient: User
    context: Post | Comment
    message: string
    time: string
    viewed: boolean
}