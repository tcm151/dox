export interface Voteable {
    id: string
    votes: {
        positive: string[]
        misleading: string[]
        negative: string[]
    }
}

export interface User extends Voteable {
    id: string
    email: string
    name: string
    topics: string[]
    following: string[]
    followers: string[]
    dateCreated: string
    admin: boolean
}

export interface Post extends Voteable {
    id: string
    time: string
    user: User
    title: string
    content: string
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

export interface Topic extends Voteable {
    id: string
    posts?: Post[]
}

export interface Comment extends Voteable {
    id: string
    time: string
    user: User
    post: Post
    replyTo: string
    content: string
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