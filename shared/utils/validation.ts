export const useValidation = () => {
    const user = {
        email: (v: string) => /^\S+@\S+\.\S+$/.test(v),
        name: (v: string) => /^[\w]{3,32}$/.test(v),
        password: (v: string) => /^[\S]{8,64}$/.test(v),
        description: (v: string) => /^[\w\W]{0,256}$/.test(v)
    }

    const post = {
        title: (v: string) => /.{4,128}/.test(v)
    }

    const topic = {
        name: (v: string) => /^\b[A-Za-z]{3,24}\b$/.test(v)
    }

    const record = {
        id: (v: string) => /^\w+:\w+$/.test(v)
    }

    return {
        user, post, topic, record
    }
}