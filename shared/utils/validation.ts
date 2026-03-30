export const useValidation = () => {
    const user = {
        email: (v: string) => /^\S+@\S+\.\S+$/.test(v),
        name: (v: string) => /^[\w]{3,32}$/.test(v),
        password: (v: string) => /^[\S]{8,64}$/.test(v),
        description: (v: string) => /^[\w\W]{0,256}$/.test(v),
    }

    const post = {
        title: (v: string) => /.{4,128}/.test(v)
    }

    const topic = {
        name: (v: string) => /^\b[A-Za-z]{3,24}\b$/.test(v)
    }

    const record = {
        id: (v: string) => /^\w+:\w+$/.test(v),
    }

    return {
        user, post, topic, record
    }
}

const valid = {
    "user.email": (v: string) => /^\S+@\S+\.\S+$/.test(v),
    "user.name": (v: string) => /^[\w]{3,32}$/.test(v),
    "user.password": (v: string) => /^[\S]{8,64}$/.test(v),
    "user.description": (v: string) => /^[\w\W]{0,256}$/.test(v),

    "post.title": (v: string) => /.{4,128}/.test(v),
    
    "topic.id": (v: string) => /^\b[A-Za-z]{3,24}\b$/.test(v),
    "record.id": (v: string) => /^\w+:\w+$/.test(v),
}

export class Validator {
    item: string
    #messages: string[] = []

    constructor(item: string) {
        this.item = item
    }

    add(value: string, type: keyof typeof valid) {
        if (!valid[type](value)) {
            this.#messages.push(`Invalid ${type}`)
        }
        return this
    }

    confirm() {
        if (this.#messages.length > 0) {
            throw createError({
                status: 400,
                statusText: `Validation failed for: ${this.item}`,
                message: this.#messages.join(". "),
            })
        }
    }
}