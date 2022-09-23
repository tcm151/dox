<script setup lang="ts">
import Tag from '../utilities/Tag.vue';

</script>

<template>
    <div class="box mb-2 content">
        <h2>Recommended Topics</h2>
        <div class="topics">
            <Tag label="AskDox" class="is-light is-link m-0" route="/topic/AskDox" />
            <Tag label="Movies" class="is-light is-link m-0" route="/topic/Movies" />
            <Tag label="Unity" class="is-light is-link m-0" route="/topic/Unity" />
            <Tag label="DoxUpdates" class="is-light is-link m-0" route="/topic/DoxUpdates" />
            <Tag label="Programming" class="is-light is-link m-0" route="/topic/Programming" />
            <Tag label="Marvel" class="is-light is-link m-0" route="/topic/Marvel" />
            <Tag label="Warhammer" class="is-light is-link m-0" route="/topic/Warhammer" />
            <Tag label="NFL" class="is-light is-link m-0" route="/topic/NFL" />
        </div>
    </div>
    <div class="box mb-2 content">
        <h2>Rules</h2>
        <ol class="ml-3 mr-1">
            <li class="my-1">Upvote things that are high quailty, topical, well formed, helpful, and provide solid
                discussion upon a certain topic. We do not disencentivize discussion.</li>
            <li class="my-1">Mark things as misleading when the information given is intented to guide someone in
                the wrong direction, or stray away from the original topic of discussion.</li>
            <li class="my-1">Downvote only if something is blatantly off topic, or contains hateful or discriminatory
                language or rhetoric. Downvotes are not for disagreements. </li>
            <li class="my-1">Content which is explicitly harmful to an individual or a specific group is 100%
                unacceptable.</li>
        </ol>
    </div>
    <div class="box content">
        <h2>Submit Feedback</h2>
        <form class="feedback-form" action="">
            <textarea class="textarea" rows="4"></textarea>
            <button type="button" class="button mt-2 is-light">Submit</button>
        </form>
    </div>
</template>

<style scoped lang="scss">
@import '../../styles/global.scss';

.content {
    hyphens: auto;
    text-align: justify;

    li::marker {
        font-weight: 600;
        font-size: 0.95em;
    }

    li {
        font-weight: 500;
        font-size: 0.95em;
        padding-left: 0.25em;
    }
}

.topics {
    @include flex-hw;
    gap: 0.25em;

    .tag {
        flex: 1 1 0;
        font-weight: 600;
    }
}

.feedback-form {
    @include flex-v;
    justify-content: right;

    textarea {
        min-height: 128px;
        max-height: 512px;
    }

    button {
        font-weight: 600;
    }
}
</style>