export const useValidation = () => ({
    // user
    email: /^\S+@\S+\.\S+$/,
    username: /^[\w]{3,32}$/,
    password: /^[\S]{8,64}$/,
    
    // post
    title: /.{4,128}/,
    
    topic: /^\b[A-Za-z]{3,24}\b$/
})