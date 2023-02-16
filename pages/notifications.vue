<script setup lang="ts">
import { Notification } from '~/types/types';

const session = getSession();
let notifications = await session.useApi<Notification[]>("/api/profile/notifications");
</script>

<template>
    <div id="notifications" class="column g-2">
        <ClientOnly>
            <div v-for="notification in notifications">
                <div class="notification">
                    <div class="message" v-html="renderMarkdown(notification.message)">
                    </div>
                    <div class="row-fit g-2 mt-2">
                        <span class="link">Context</span>
                        <span class="info">{{ formatDate(notification.time) }}</span>
                        <span class="danger">Dismiss</span>
                    </div>
                </div>
            </div>
        </ClientOnly>
    </div>
</template>

<style lang="scss">
.message {
    blockquote {
        padding: 0.5rem !important;
    }
}
</style>

<style scoped lang="scss">
@import "~/assets/global.scss";

#notifications {
    @include fill-width(800px);
}

.notification {
    background-color: $dox-white-ultra;
    border-radius: 0.25rem;
    padding: 0.5rem;

    span {
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-weight: 700;
        cursor: pointer;
    }
}

.message {
    @include flex-v (0.5rem);
}
</style>