<template>
<div class="columns my-6 is-centered">
    <form class="column box p-6 is-5">
        <div class="field">
            <label class="label">Email</label>
            <div class="control">
                <input class="input" type="text">
            </div>
        </div>
        <div class="field">
            <label class="label">Username</label>
            <div class="control">
                <input class="input" type="text">
            </div>
        </div>
        <div class="field">
            <label class="label">Password</label>
            <div class="control">
                <input class="input" type="password">
            </div>
        </div>
        <div class="field">
            <label class="label">Confirm Password</label>
            <div class="control">
                <input class="input" type="password">
            </div>
        </div>
        <div class="field columns is-centered is-grouped mt-6">
            <div class="control">
               <button class="button is-primary">Register</button>
            </div>
            <div class="control">
                <button class="button is-danger">Cancel</button>
            </div>
        </div>
    </form>
</div>
</template>

<script setup lang="ts">
</script>