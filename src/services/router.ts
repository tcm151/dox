import { createRouter, createWebHistory } from "vue-router"
import Dev from "../views/Dev.vue"
import Home from "../views/Home.vue"
import Post from "../views/Post.vue"
import Error from "../views/Error.vue"
import About from "../views/About.vue"
import Topic from "../views/Topic.vue"
import Editor from "../views/Editor.vue"
import Profile from "../views/Profile.vue"
import Register from "../views/Register.vue"

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            name: "Home",
            path: "/",
            component: Home,
        },
        {
            name: "About",
            path: "/about",
            component: About,
        },
        {
            name: "Post",
            path: "/posts/:post_id",
            component: Post,
        },
        {
            name: "Editor",
            path: "/editor",
            component: Editor,
        },
        {
            name: "Register",
            path: "/register",
            component: Register,
        },
        {
            name: "Profile",
            path: "/profile/:username",
            component: Profile,
        },
        {
            name: "Topic",
            path: "/topic/:topic",
            component: Topic,
        },
        {
            name: "Dev",
            path: "/dev",
            component: Dev,
        },
        {
            name: "404",
            path: "/*",
            component: Error,
        },
    ],
})

export function navigateTo(route: string, beforeRoute?: Function, afterRoute?: Function) {
    beforeRoute?.()
    router.push(route)
    afterRoute?.()
}
