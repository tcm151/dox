<script setup lang="ts">
definePageMeta({
    layout: 'simple'
})

const hints = useHints()
const session = getSession()
const { public: { baseUrl } } = useRuntimeConfig()

const offers = ref([
    { cost: 1, tokens: 1028 },
    { cost: 4, tokens: 4096 },
    { cost: 16, tokens: 16384 },
    { cost: 32, tokens: 32768 },
    { cost: 64, tokens: 65536 },
])

function copyReferralLink() {
    const referralLink = `${baseUrl}/register?referral=${extractId(session.user.id)}`
    navigator.clipboard.writeText(referralLink)
    hints.addSuccess('Copied link to clipboard.')
    hints.addSuccess('Share with another someone to get 1024 free tokens when they create their account.')
}
</script>

<template>
    <article class="grid center g-2 py-4">
        <!-- <section class="mb-4">
            <div class="box banner">
                <h2>This could be your ad.</h2>
                <p>Contact to showcase your product/service on this storefront.</p>
            </div>
        </section> -->
        <section class="box row wrap g-4 p-5">
            <div class="offer box f-1 p-5" v-for="offer in offers" @click="hints.addWarning('We are still working on this...')">
                <h2 class="tokens row g-2">
                    <span>{{ offer.tokens.toLocaleString() }}</span>
                    <i class="fa-solid fa-cube"></i>
                </h2>
                <p>{{ formatAs('currency', offer.cost) }}</p>
            </div>
        </section>
        <section class="row wrap g-2">
            <div class="welcome box column f-1 g-2 p-5 text break">
                <h2 class="row inline g-2">
                    <i class="fa-solid fa-cube"></i>
                    <span>Store</span>
                </h2>
                <p>You can buy additional tokens here. You need tokens to upload images and award posts. You start with some tokens for free, and can gain more by referring new users.</p>
                <p>You currently have <strong>{{ session.user.tokens }}</strong> tokens.</p>
            </div>
            <div class="referrals box f-1 grid center g-4 p-5">
                <button class="link px-6 py-4" @click="copyReferralLink">
                    <i class="fa-solid fa-handshake-simple"></i>
                    <span>Refer a Friend</span>
                </button>
                <button class="link px-6 py-4" @click="hints.addWarning('We are still working on this...')">
                    <i class="fa-solid fa-barcode"></i>
                    <span>Enter Referral</span>
                </button>
            </div>
        </section>
        <!-- <section>
            <div class="box banner mt-4">
                <h2>This could be your ad.</h2>
                <p>Contact to showcase your product on this storefront.</p>
            </div>
        </section> -->
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}

div.offer {
    text-align: right;
    color: $yellow;
    // border: 2px solid $yellow;
    background-color: $yellow-light;
    cursor: pointer;

    .tokens {
        justify-content: flex-end;
        align-items: center;
    }
}

div.offer:hover {
    color: $yellow-light;
    background-color: $yellow;
}

div.welcome {
    flex-basis: 50%;
    overflow-x: hidden;
}

div.referrals {
    flex-basis: 10%;
    white-space: nowrap;
}

div.box.banner {
    text-align: center;
    border: 2px solid $white-3;
    color: $white-3;
    background-color: $white-2;
}
</style>