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
    tokens: number
    confirmed: boolean
    verified: boolean // TODO implement sitewide
    admin: boolean
}

export interface Confirmation {
    id: string
    user: User | string
    time: string
    used: boolean
    expired: boolean
}

export interface Topic extends Voteable {
    id: string
    posts?: Post[]
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
    images: Image[]
    edited: boolean
    timeEdited?: string
    visits: number
}

export interface Draft {
    id: string
    user: User | string
    title: string
    content: string
    time: string
    replyTo?: Post | string
    topics: string[]
    images: Image[]
    // edited: boolean
    // timeEdited?: string
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


export interface Comment extends Voteable {
    id: string
    user: User | string
    post: Post | string
    content: string
    time: string
    replyTo: Post | Comment | string
    edited: boolean
    timeEdited?: string
}

export interface Image {
    id: string
    user: User | string
    type: string
    tokens: number
    time: string
    url: string
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

export interface Report {
    id: string
    reporter: User | string
    subject: string
    time: string
}

export interface Backup {
    environment: string
    user: User | string
    date: string
}