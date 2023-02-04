<script setup lang="ts">
defineProps<{ visible: boolean }>()

const session = getSession();
const events = useEvents();

const username = ref("");
const password = ref("");

const hints = useHints();

const login = async () => {
    try {
        await session.login(username.value, password.value);
        events.publish("toggleLogin");
        username.value = ""
        password.value = ""
    }
    catch (ex) {
        hints.addError("Username or password were incorrect.")
    }
}

</script>

<template>
    <Popup :visible="visible" title="Login" accept-label="Login" @accept="login" decline-label="Cancel" @decline="events.publish('toggleLogin')">
        <div class="login form">
            <div class="field">
                <label>Username</label>
                <input v-model="username" type="text" />
            </div>
            <div class="field">
                <label>Password</label>
                <input v-model="password" @keyup.enter="login" type="password" />
            </div>
        </div>
    </Popup>
</template>

<style scoped lang="scss">
@import "~/assets/global.scss";

.form {
    width: 256px;
}
</style>