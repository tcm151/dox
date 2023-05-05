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
    // TODO implement fields for:
    confirmed: boolean
    verified: boolean
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
    images?: Image[]
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
    images?: Image[]
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

export interface Image {
    id: string
    url: string
    type: string
    user: User
    time: string
}

export interface Notification {
    id: string
    recipient: User
    context: Post | Comment
    message: string
    time: string
    viewed: boolean
}

export interface Feedback {
    id: string
    user: User
    time: string
    content: string
}