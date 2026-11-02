<script setup lang="ts">
import type { Moderation } from "@@/shared/types"
import { parseRecordId } from "@@/shared/utils/records"


const props = defineProps<{
    id: string
}>()

const emit = defineEmits<{
    (event: "updated"): void
}>()

const hints = useHints()
const session = getSession()
const settings = useSettings()

type SubjectType = "post" | "gallery" | "comment" | "thread"
type ControlState = Pick<Moderation, "locked" | "slowed">[]
const subjectTypes: SubjectType[] = ["post", "gallery", "comment", "thread"]

const subject = computed(() => {
    const parsed = parseRecordId(props.id)
    if (!parsed || !subjectTypes.includes(parsed.table as SubjectType)) return
    return { type: parsed.table as SubjectType, id: parsed.id }
})
const canModerate = computed(() => session.isAuthenticated && (hasRole(session.user, "moderator") || hasRole(session.user, "admin")))
const canSlow = computed(() => subject.value?.type !== "comment")
const slowModes = computed(() => [...settings.app.moderation.slowModes].sort((left, right) => left - right))
const state = ref<ControlState>()
const selectedInterval = ref<number>()
const loading = ref(false)
const saving = ref(false)
const forbidden = ref(false)

function formatInterval(interval: number) {
    return interval % 60 === 0 ? `${interval / 60}m` : `${interval}s`
}

async function refresh() {
    const currentSubject = subject.value
    if (!canModerate.value || !currentSubject) return
    loading.value = true
    try {
        state.value = await useApi<ControlState>(`/api/moderation/${currentSubject.type}/${currentSubject.id}`, { method: "GET" })
        forbidden.value = false
        selectedInterval.value = state.value?.[0]?.slowed ?? slowModes.value[0]
    }
    catch (error: any) {
        const statusCode = error.statusCode ?? error.status
        if (statusCode === 403) {
            forbidden.value = true
        }
        else {
            hints.addError(error.message, error)
        }
    }
    finally {
        loading.value = false
    }
}

async function updateLock() {
    const currentSubject = subject.value
    if (saving.value || !currentSubject) return
    saving.value = true
    try {
        if (state.value?.[0]?.locked) {
            await useApi(`/api/moderation/${currentSubject.type}/${currentSubject.id}/lock/clear`, { method: "POST" })
        }
        else {
            await useApi(`/api/moderation/${currentSubject.type}/${currentSubject.id}/lock/apply`, {
                method: "POST",
                body: { scope: "item" },
            })
        }
        await refresh()
        emit("updated")
    }
    catch (error: any) {
        hints.addError(error.message, error)
    }
    finally {
        saving.value = false
    }
}

async function setSlowMode() {
    const currentSubject = subject.value
    if (saving.value || selectedInterval.value === undefined || !currentSubject) return
    saving.value = true
    try {
        await useApi(`/api/moderation/${currentSubject.type}/${currentSubject.id}/slow/apply`, {
            method: "POST",
            body: { interval: selectedInterval.value },
        })
        await refresh()
        emit("updated")
    }
    catch (error: any) {
        hints.addError(error.message, error)
    }
    finally {
        saving.value = false
    }
}

async function clearSlowMode() {
    const currentSubject = subject.value
    if (saving.value || !currentSubject) return
    saving.value = true
    try {
        await useApi(`/api/moderation/${currentSubject.type}/${currentSubject.id}/slow/clear`, { method: "POST" })
        await refresh()
        emit("updated")
    }
    catch (error: any) {
        hints.addError(error.message, error)
    }
    finally {
        saving.value = false
    }
}

onMounted(refresh)
</script>

<template>
    <section v-if="canModerate && subject && !forbidden" class="moderation-controls column g-2">
        <button :disabled="saving" @click="updateLock">
            <i class="fa-solid" :class="state?.[0]?.locked ? 'fa-lock-open' : 'fa-lock'"></i>
            <span>{{ state?.[0]?.locked ? "Unlock" : "Lock" }}</span>
        </button>

        <div v-if="canSlow" class="column g-1">
            <div v-if="state?.[0]?.slowed" class="row g-1">
                <button class="f-1" :disabled="saving" @click="clearSlowMode">
                    <i class="fa-solid fa-ban"></i>
                    <span>Slowed</span>
                </button>
            </div>
            <template v-else>
                <div class="row g-1">
                    <button class="f-2 b-0" :disabled="saving || selectedInterval === undefined" @click="setSlowMode">
                        <i class="fa-solid fa-hourglass-half"></i>
                        <span>Slow</span>
                    </button>
                    <label class="field text-center f-1 b-0">
                        <select class="slow-mode-select" v-model.number="selectedInterval" :disabled="saving || slowModes.length === 0">
                            <option v-for="interval in slowModes" :key="interval" :value="interval">{{ formatInterval(interval) }}</option>
                        </select>
                    </label>
                </div>
            </template>
        </div>
    </section>
</template>

<style scoped lang="scss">
.text-center {
    text-align: center;
}

.slow-mode-select {
    text-align: center;
    text-align-last: center;
    justify-content: center;

    &::picker-icon {
        position: static;
        margin-inline-start: 0.375rem;
        padding: 0;
    }

    option {
        text-align: center;
    }
}
</style>
