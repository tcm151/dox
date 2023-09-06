<script setup lang="ts">
</script>

<template>
    <article class="p-4">
        <div class="about column g-4 p-5">
            <section>
                <h1>What is this?</h1>
                <p>DOX is a flexible forum which can facilitate questions, answers, discussion, blogs, documenation, wikis, and many other types of online forums.</p>
                <p>People are free to talk about whatever they want, and form communities around certains interests, topics, events, cultures, individuals... whatever.</p>
            </section>
            <section>
                <h1>What can I do here?</h1>
                <p>Everything starts with a post. Any verified user can write a post which can be viewed by the public. Every post has a title, some content, and up to five related Topics.</p>
                <p>Topics are one of the main ways to curate your experience on DOX. You can view all of the trending posts using a specific topic, follow topics so they will show up in your feed, and use specific topics on your posts so they can best reach the right communities.</p>
                <p>It is easy to form distinct communities using different topics, while also promoting the diversification of ideas between communities by mixing topics. Having a restriction of five topics forces users to choose carefully about which topics best fit the content of their post.</p>
            </section>
            <section>
                <h1>Are there any moderators?</h1>
                <p>Our community is it's own moderator. Using the voting system that DOX is built on top of, users take control of what they want to interact with. Every post, comment and public interaction on DOX can be given a vote. Either positive, misleading, or negative. And the numbers are not fudged, each vote corresponds to a unique user.</p>
                <p>Truth exists upon a spectrum, and at DOX we understand that knowledge, understanding, and popular opinion drift over time. Whether something is considered complete fact or utter conspiracy, can do a complete 180 as time goes on.</p>
                <p>The goal of the voting system is to give our users as much insight as possible into every interaction. By using the ratio, quantity, and trends of voting distributions, users can make a more informed decisions on how to interact with certain content.</p>
            </section>
            <section>
                <h1>What about my privacy?</h1>
                <p>What you share about yourself is up to you, however anything you post on DOX will be there for as long as the site is available. You may delete your account and any metadata related to yourself, however the content of your posts and your comments will not be deleted and will remain available indefinitely.</p>
                <p>It is important to us at DOX that information is saved and kept for the future. Knowledge and understanding is sum of all human experience and DOX aims to be THE internet archive of the future.</p>
            </section>
            <section>
                <h1>Will this ever cost money?</h1>
                <p>We will never charge our users for access to any of the functionality of DOX.</p>
                <p>However for this site to remain operational, then our costs need to be covered and our developers need to be compensated fairly. Our goal is not profits. We care about the free access to information on the internet.</p>
                <p>If you wish to support us financially, you can do so on our Patreon.</p>
            </section>
        </div>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width (800px, 1rem);
}

.about {
    display: flex;
    flex-flow: column wrap;
    border-radius: 0.25rem;
    background-color: $dox-white-0;
}

section {
    h1 {
        font-size: 1.5rem;
        margin-bottom: 1rem !important;
    }
    
    p:not(:last-child) {
        margin-bottom: 1rem;
    }
}
</style>