export interface Voteable {
    id: string
    votes: {
        positive: string[]
        misleading: string[]
        negative: string[]
        awards?: string[]
        saves?: string[]
    }
}

export interface User extends Voteable {
    id: string
    email: string
    name: string
    link?: string
    description?: string
    topics: string[]
    following: string[]
    followers: string[]
    dateCreated: string
    confirmed: boolean
    admin: boolean
    tokens: number
    // TODO implement fields for:
    verified: boolean
}

export interface Post extends Voteable {
    id: string
    user: User | string
    title: string
    content: string
    time: string
    replyTo?: Post | string
    topics: string[]
    comments: string[]
    images?: Image[]
    edited?: boolean
    timeEdited?: string
    visits?: number
}

export interface Draft {
    id: string
    user: User | string
    title: string
    content: string
    time: string
    replyTo?: Post | string
    topics: string[]
    images?: Image[]
    edited?: boolean
    timeEdited?: string
}

export interface Thread extends Voteable {
    id: string
    user: User | string
    content: string
    time: string
    replyTo?: Post | string
    topics: string[]
    comments: string[]
    images?: Image[]
    edited?: boolean
    timeEdited?: string
    views?: number
}

export interface Topic extends Voteable {
    id: string
    posts?: Post[]
}

export interface Comment extends Voteable {
    id: string
    time: string
    user: User | string
    post: Post | string
    replyTo: string
    content: string
    edited?: boolean
    timeEdited?: string
}

export interface Image {
    id: string
    url: string
    type: string
    user: User | string
    time: string
    tokens: number
}

export interface Notification {
    id: string
    recipient: User | string
    context: Post | Comment | string
    message: string
    time: string
    viewed: boolean
}

export interface Feedback {
    id: string
    user: User | string
    time: string
    content: string
}

export interface Backup {
    environment: string
    user: User | string
    date: string
}