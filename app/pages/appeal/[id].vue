<script setup lang="ts">
import type { Report } from "@@/shared/types"

definePageMeta({
    middleware: () => {
        if (ENV.isClient() && !getSession().isAuthenticated) {
            return abortNavigation()
        }
    },
})

const route = useRoute()
const hints = useHints()
const session = getSession()

const reportId = route.params.id?.toString() ?? ""
type OwnerAppealView = Pick<Report, "id" | "subject" | "status" | "moderator" | "history">

const { data: report, pending, refresh } = await useAuthenticatedDatasource<OwnerAppealView>(`/api/profile/appeals/${reportId}`)

const submittedAppeal = computed(() => report.value?.history.findLast(entry => entry.action === "report.appeal.submitted"))
const appealDecision = computed(() => report.value?.history.findLast(entry =>
    entry.action === "report.appeal.accepted" || entry.action === "report.appeal.rejected"))

const status = computed(() => {
    if (!submittedAppeal.value) return "Not Submitted"
    if (report.value?.status === "appealed") return "Pending"
    if (appealDecision.value?.action === "report.appeal.accepted") return "Accepted"
    if (appealDecision.value?.action === "report.appeal.rejected") return "Rejected"
    return "Closed"
})

const canSubmit = computed(() => report.value?.status === "removed" && !submittedAppeal.value)

const reason = ref("")
const submitting = ref(false)
async function submitAppeal() {
    const normalizedReason = reason.value.trim()
    if (normalizedReason.length < 3) {
        hints.addWarning("Appeal reasons must be at least 3 characters.")
        return
    }

    try {
        submitting.value = true
        await useApi(`/api/report/${reportId}/appeal`, {
            method: "POST",
            body: { reason: normalizedReason },
        })
        reason.value = ""
        await refresh()
        hints.addSuccess("Your appeal was submitted for moderator review.")
    }
    catch (submitError: any) {
        hints.addError(submitError.message, submitError)
    }
    finally {
        submitting.value = false
    }
}

function viewContent() {
    if (report.value) {
        navigateTo(`/${report.value.subject.id.replace(":", "/")}`)
    }
}
</script>

<template>
    <article class="content-width p-4">
        <ClientOnly>
            <section v-if="pending" class="box empty-state">
                <p>Loading appeal...</p>
            </section>
            <section v-else-if="report" class="box column g-2 p-4">
                <header class="row between inline">
                    <h1>Appeal Removal</h1>
                    <button type="button" class="small" @click="viewContent">
                        <i class="fa-solid fa-eye"></i>
                        <span>View Content</span>
                    </button>
                </header>
                <template v-if="submittedAppeal">
                    <div class="row g-1">
                        <Tag class="danger f-1" :label="status" />
                        <DurationTag :time="submittedAppeal.time" />
                    </div>
                    <blockquote v-if="appealDecision">
                        <strong>{{ appealDecision.user.name ?? "Moderator" }}:</strong>
                        {{ appealDecision.message }}
                    </blockquote>
                    <blockquote>
                        <strong>{{ session.user.name }}:</strong>
                        {{ submittedAppeal.message }}
                    </blockquote>
                </template>
                <template v-else-if="canSubmit">
                    <blockquote v-if="report.history.findLast(entry => entry.action === 'report.removed')">
                        <strong>{{ report.moderator?.name ?? "Moderator" }}:</strong>
                        {{ report.history.findLast(entry => entry.action === 'report.removed')?.message }}
                    </blockquote>
                    <label class="field">
                        <textarea v-model="reason" rows="4" minlength="3" placeholder="Explain why this decision should be reviewed" />
                    </label>
                    <div class="row wrap g-1">
                        <ButtonSpinner class="f-2" :loading="submitting" @click="submitAppeal">
                            <i class="fa-solid fa-scale-balanced"></i>
                            <span>Submit Appeal</span>
                        </ButtonSpinner>
                    </div>
                </template>
                <p v-else>This report is not eligible for an appeal.</p>
            </section>
            <aside v-else class="empty-state">
                No report found.
            </aside>
        </ClientOnly>
    </article>
</template>