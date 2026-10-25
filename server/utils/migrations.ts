type Migration = {
    version: string
    sql: string
}

export async function runMigrations() {
    const health = useHealth()
    const applicationVersion = useRuntimeConfig().public.version
    
    let currentVersion = await getCurrentVersion()
    console.log(`Current database version: ${currentVersion}`)

    if (currentVersion === "0.0.0") {
        console.log(`Starting freshing application install for version: ${applicationVersion}`)
        const storage = useStorage("assets:server")
        const schema = Buffer.from(await storage.getItem<string>("schema.surql") ?? "").toString().trim()
        if (!schema) {
            throw new Error("server/assets/schema.surql is missing or empty.")
        }
        else {
            await new DatabaseQuery()
                .addSql(schema)
                .addParameter("version", applicationVersion)
                .execute()
        }
    }
    else {
        const migrations = await loadMigrations(currentVersion)
        if (migrations.length > 0) {
            for (const migration of migrations) {
                console.log(`Applying migration for version: ${migration.version}`)
                try {
                    await new DatabaseQuery()
                        .addSql(migration.sql)
                        .execute()
                }
                catch (cause) {
                    health.setVersion(migration.version)
                    throw new Error(`Migration ${migration.version} failed.`, { cause })
                }
            }
            currentVersion = await getCurrentVersion()
            console.log(`Successfully upgraded application to: ${currentVersion}`)
        }
    }

    health.setVersion(applicationVersion)
}

export async function replayCurrentMigration(): Promise<string> {
    const applicationVersion = useRuntimeConfig().public.version
    const databaseVersion = await getCurrentVersion()
    if (databaseVersion !== applicationVersion) {
        throw new Error(`Cannot replay migration ${applicationVersion} while the database is at ${databaseVersion}.`)
    }

    const storage = useStorage("assets:server")
    const migration = Buffer.from(await storage.getItem<string>(`migrations/${applicationVersion}.surql`) ?? "").toString().trim()
    if (!migration) {
        throw new Error(`Migration ${applicationVersion} is missing or empty.`)
    }

    await new DatabaseQuery()
        .addSql(migration)
        .execute()

    return applicationVersion
}

async function getCurrentVersion(): Promise<string> {
    const hasTables = await new DatabaseQuery()
        .addSql(`
            RETURN object::len((INFO FOR DB).tables) > 0;
        `)
        .queryValue<boolean>()

    if (!hasTables) {
        return "0.0.0"
    }

    const hasMigrations = await new DatabaseQuery()
        .addSql(`
            RETURN (INFO FOR DB).tables CONTAINS "migration";
        `)
        .queryValue<boolean>()
        
    if (!hasMigrations) {
        return "2026.0.0"
    }

    const latestMigration = await new DatabaseQuery()
        .addSql(`
            SELECT version, time
            FROM migration
            ORDER BY time DESC
            LIMIT 1;
        `)
        .queryOne<{ version: string }>()

    return latestMigration.version
}

async function loadMigrations(currentVersion: string): Promise<Migration[]> {
    const storage = useStorage("assets:server")
    const files = await storage.getKeys("migrations/")
    const available = files.map(name => ({ key: name, version: name.slice("migrations/".length, -".surql".length) }))
        .filter(({ version }) => compareVersions(version, currentVersion) > 0)
        .sort((left, right) => compareVersions(left.version, right.version))

    const migrations: Migration[] = []
    for (const item of available) {
        const sql = Buffer.from(await storage.getItem<string>(item.key) ?? "").toString().trim()
        migrations.push({ version: item.version, sql })
    }

    return migrations
}

function compareVersions(left: string, right: string) {
    return left.localeCompare(right, undefined, { numeric: true })
}