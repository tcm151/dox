export interface AppSettings {
    id: string
    navbar: {
        showStore: boolean,
        showFeedback: boolean,
    }
    feed: {
        showSearch: boolean,
        showTopics: boolean,
        showThreads: boolean,
        showImages: boolean,
    }
    voting: {
        showMisleading: boolean
        showNegative: boolean
    }
}

export interface Voteable {
    id: string
    votes: {
        positive: string[]
        misleading: string[]
        negative: string[]
        awards: string[]
        saves: string[]
        score: number
    }
}

// REFACTOR split off account into its own type
export interface Account {
    id: string
    email: string
    password: string
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
    dateJoined: string
    tokens: number
    roles: Role[]
    traits: Trait[]
}

export type Role = "admin" | "developer" | "moderator"
export type Trait = "confirmed" | "verified" 

export interface Confirmation {
    id: string
    user: User | string
    time: string
    used: boolean
    expired: boolean
}

export interface Topic extends Voteable {
    id: string
    posts: Post[]
    threads: Thread[]
    followers: (User | string)[]
    firstUsed: string
}

export interface Post extends Voteable {
    id: string
    user: User | string
    title: string
    content: string
    time: string
    replyTo?: Post | string
    topics: string[]
    comments: (Comment | string)[]
    images: Image[]
    archived: boolean
    edited: boolean
    timeEdited?: string
    visits: number
}

export interface Pin {
    id: string
    post: Post | string
    user: User | string
    active: boolean
    time: string
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
    replyTo?: Thread | string
    topics: string[]
    images: Image[]
    edited?: boolean
    timeEdited?: string
    visits: number
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

export interface Media extends Voteable {
    id: string
    user: User | string
    type: string
    name: string
    tokens: number
    time: string
    url: string
}

export interface Image extends Media { }
export interface Audio extends Media { }

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
    dismissed: boolean
}

export interface Report {
    id: string
    reporter: User | string
    subject: Voteable | string
    time: string
}

export interface Backup {
    environment: string
    user: User | string
    date: string
}