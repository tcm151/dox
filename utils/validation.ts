export const useValidation = () => ({
    email: /^\S+@\S+\.\S+$/,
    username: /^[\w]{3,32}$/,
    password: /^[\S]{8,64}$/,
})