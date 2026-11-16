<script setup lang="ts">
import { displayBaseUrl, displayDeveloperValue } from "@@/app/utils/developer-info"

const config = useRuntimeConfig()
const hints = useHints()

const entries = [
    { label: "Version", value: displayDeveloperValue(config.public.version) },
    { label: "Base URL", value: displayBaseUrl(window.location.origin) },
    { label: "Build date", value: displayDeveloperValue(config.public.buildDate) },
    { label: "Git commit", value: displayDeveloperValue(config.public.gitCommit) },
    { label: "Git ref", value: displayDeveloperValue(config.public.gitRef) },
    { label: "Mode", value: import.meta.dev ? "Development" : "Production" },
]

const supportSummary = [
    "ClassicForum support summary",
    ...entries.map(entry => `${entry.label}: ${entry.value}`),
].join("\n")

async function copySupportSummary() {
    try {
        await navigator.clipboard.writeText(supportSummary)
        hints.addSuccess("Support summary copied.")
    }
    catch (error) {
        hints.addError("Unable to copy the support summary.", error)
    }
}
</script>

<template>
    <article class="developer-info content-width column g-2 p-4">
        <header class="row wrap inline between g-2">
            <h1>Info</h1>
            <button class="link" type="button" @click="copySupportSummary">
                <i class="fa-solid fa-copy"></i>
                Copy Summary
            </button>
        </header>
        <section class="box content column g-2 px-4">
            <table aria-label="Developer diagnostics">
                <thead>
                    <tr>
                        <th>Property</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="entry in entries" :key="entry.label">
                        <th scope="row">{{ entry.label }}</th>
                        <td>{{ entry.value }}</td>
                    </tr>
                </tbody>
            </table>
        </section>
    </article>
</template>

<style scoped lang="scss">
.developer-info table tbody th {
    background-color: transparent;
}

.developer-info table th,
.developer-info table td {
    text-align: left;
}

.developer-info table td:last-child {
    overflow-wrap: anywhere;
}
</style>