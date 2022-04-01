import Main from "./Main.vue"

import { createApp } from "vue"
import { store } from "./services/store"
import { router } from "./services/router"

createApp(Main).use(router).use(store).mount("#app")
