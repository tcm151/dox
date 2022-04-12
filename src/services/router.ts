import { createRouter, createWebHistory } from "vue-router"
import Home from "../views/Home.vue"
import Post from "../views/Post.vue"
import Error from "../views/Error.vue"
import About from "../views/About.vue"
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
            path: "/profile",
            component: Profile,
        },
        {
            name: "404",
            path: "/*",
            component: Error,
        },
    ],
})
