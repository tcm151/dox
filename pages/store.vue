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
    <article class="grid center g-4 py-4">
        <section class="mb-4">
            <div class="box advert">
                <h2>This could be your ad.</h2>
                <p>Contact to showcase your product/service on this storefront.</p>
            </div>
        </section>
        <section class="row-wrap g-4">
            <div class="offer box fill" v-for="offer in offers" @click="hints.addWarning('We are still working on this...')">
                <h2 class="tokens g-2">
                    <span>{{ offer.tokens.toLocaleString() }}</span>
                    <i class="fa-solid fa-cube"></i>
                </h2>
                <p>{{ formatAs('currency', offer.cost) }}</p>
            </div>
        </section>
        <section class="row-wrap g-4">
            <div class="welcome box fill column g-2">
                <h2 class="row center-inline g-2">
                    <i class="fa-solid fa-coins"></i>
                    <span>Store</span>
                </h2>
                <p>You can buy additional tokens here. You need tokens to upload images and award posts. You start with some tokens for free, and can gain more by referring new users.</p>
                <p>You currently have <strong>{{ session.user.tokens }}</strong> tokens.</p>
            </div>
            <div class="referrals box fill grid center g-4">
                <button class="link" @click="copyReferralLink">
                    <i class="fa-solid fa-handshake-simple"></i>
                    <span>Refer a Friend</span>
                </button>
                <button class="link" @click="hints.addWarning('We are still working on this...')">
                    <i class="fa-solid fa-barcode"></i>
                    <span>Enter Referral</span>
                </button>
            </div>
        </section>
        <section>
            <div class="box advert mt-4">
                <h2>This could be your ad.</h2>
                <p>Contact to showcase your product on this storefront.</p>
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(800px, 1rem);
}

div.box {
    padding: 2rem;
}

div.box.offer {
    padding: 1.75rem;
}

div.box.offer {
    text-align: right;
    border: 2px solid $dox-yellow;
    cursor: pointer;

    .tokens {
        @include flex-h (0.25rem);
        justify-content: flex-end;
        align-items: center;

        i.fa-cube {
            color: $dox-yellow;
        }
    }
}

div.box.offer:hover {
    background-color: $dox-yellow-light;
}

div.welcome {
    flex-basis: 50%;
    overflow-x: hidden;
    white-space: break-spaces;
}

div.referrals {
    flex-basis: 10%;
    white-space: nowrap;
}

div.box.advert {
    text-align: center;
    border: 2px solid $dox-white-dark;
    color: $dox-white-dark;
    background-color: $dox-white;
}
</style>