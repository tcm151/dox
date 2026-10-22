type ScheduledTask = {
    callback: () => void | Promise<void>
    interval: number
    pointer?: ReturnType<typeof setInterval>
    running?: Promise<void>
}

class ScheduledTaskManager {
    private started = false
    private configured = false
    private readonly tasks: ScheduledTask[] = []

    add(callback: ScheduledTask["callback"], interval: number) {
        if (!Number.isFinite(interval) || interval <= 0) {
            throw new RangeError("Scheduled task interval must be a positive number.")
        }
        if (this.started) {
            throw new Error("Cannot add scheduled tasks after the manager has started.")
        }

        this.tasks.push({ callback, interval })
    }

    async start(registerTasks: (manager: ScheduledTaskManager) => void) {
        if (this.started) return

        if (!this.configured) {
            registerTasks(this)
            this.configured = true
        }

        this.started = true

        await Promise.all(this.tasks.map(task => this.run(task)))
        if (!this.started) return

        for (const task of this.tasks) {
            task.pointer = setInterval(() => { void this.run(task)}, task.interval)
            const timer = task.pointer as unknown as { unref?: () => void }
            timer.unref?.()
        }
    }

    async stop() {
        this.started = false

        const runningTasks: Promise<void>[] = []
        for (const task of this.tasks) {
            if (task.pointer) clearInterval(task.pointer)
            task.pointer = undefined
            if (task.running) runningTasks.push(task.running)
        }

        await Promise.allSettled(runningTasks)
    }

    private run(task: ScheduledTask) {
        if (task.running) return task.running

        task.running = Promise.resolve()
            .then(task.callback)
            .catch(error => {
                console.error("Scheduled task failed.", error)
            })
            .finally(() => {
                task.running = undefined
            })

        return task.running
    }
}

export const scheduledTaskManager = new ScheduledTaskManager()