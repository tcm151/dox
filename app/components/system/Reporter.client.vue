<script setup lang="ts">
const events = useEvents()
const hints = useHints()

const subject = ref("")
const reason = ref("")
const visible = ref(false)
const loading = ref(false)

events.subscribe(Trigger.reportContent, (reportSubject: string) => {
    subject.value = reportSubject
    reason.value = ""
    visible.value = true
})

function closeReporter() {
    visible.value = false
    subject.value = ""
    reason.value = ""
}

async function submitReport() {
    const normalizedReason = reason.value.trim()
    if (!normalizedReason) {
        hints.addError("Enter a reason for this report.")
        return
    }

    try {
        loading.value = true
        await useApi("/api/report/send", {
            body: { subject: subject.value, reason: normalizedReason },
        })
        hints.addSuccess("Thank you for reporting this content.")
        closeReporter()
    }
    finally {
        loading.value = false
    }
}
</script>

<template>
    <Popup
        v-if="visible"
        title="Report Content"
        width="30rem"
        :loading="loading"
        :accept="{ label: 'Submit', action: submitReport }"
        :decline="{ label: 'Cancel', action: closeReporter }"
    >
        <p>This will be sent to the moderators for review.</p>
        <textarea rows="4" required v-model="reason" />
    </Popup>
</template>