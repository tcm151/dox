#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/../.env}"
ENV_EXAMPLE_FILE="$ROOT_DIR/.env.example"
SERVER_ENTRY="$ROOT_DIR/server/index.mjs"
SERVICE_NAME="${SERVICE_NAME:-forum}"
LOG_DIR="$(dirname "$ENV_FILE")/logs"
INSTALLER_LOG_FILE="$LOG_DIR/installer.log"
APP_LOG_FILE="$LOG_DIR/forum.log"

cd "$ROOT_DIR"

usage() {
    cat <<USAGE
Usage: ./installer.sh [install [--no-service]|run|backup|restore [archive]|status|start|stop|restart]

Commands:
    install   Stop any running service, then install and start it. This is the default.
              Use --no-service to prepare a disposable deployment without systemd.
    run       Start the app in the foreground for debugging.
    backup    Create a verified backup of an embedded database deployment.
    restore   Restore the latest embedded database backup, or a specified archive.
    status    Show the systemd service status.
    start     Start the systemd service.
    stop      Stop the systemd service.
    restart   Restart the systemd service.
USAGE
}

require_service_access() {
    if [ "$(id -u)" -ne 0 ]; then
        echo "Run this installer as root so it can manage the systemd service."
        exit 1
    fi

    if ! command -v systemctl >/dev/null 2>&1; then
        echo "systemctl is required for service installation."
        exit 1
    fi
}

stop_running_service() {
    require_service_access

    if systemctl is-active --quiet "$SERVICE_NAME"; then
        echo "Stopping running $SERVICE_NAME.service"
        systemctl stop "$SERVICE_NAME"
    else
        echo "$SERVICE_NAME.service is not running"
    fi
}

restart_service() {
    require_service_access
    systemctl restart "$SERVICE_NAME"
    echo "Restarted $SERVICE_NAME.service"
}

status_service() {
    require_service_access
    systemctl status "$SERVICE_NAME" --no-pager
}

start_service() {
    require_service_access
    systemctl start "$SERVICE_NAME"
    echo "Started $SERVICE_NAME.service"
}

ensure_environment_file() {
    if [ -f "$ENV_FILE" ]; then
        return
    fi

    if [ ! -f "$ENV_EXAMPLE_FILE" ]; then
        echo "Missing environment file: $ENV_FILE"
        echo "Create it from the packaged .env.example file or set ENV_FILE=/path/to/.env."
        exit 1
    fi

    cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
    echo "Created $ENV_FILE from .env.example"
}

require_runtime() {
    if [ -n "${NODE_BIN:-}" ]; then
        if [ ! -x "$NODE_BIN" ]; then
            echo "Configured Node.js executable is unavailable: $NODE_BIN"
            exit 1
        fi
    elif ! command -v node >/dev/null 2>&1; then
        echo "Node.js is required. Install a current Node.js LTS release, then run this script again."
        exit 1
    fi

    if [ ! -f "$SERVER_ENTRY" ]; then
        echo "Missing server entrypoint: $SERVER_ENTRY"
        echo "Use a staged release artifact that includes server/index.mjs."
        exit 1
    fi

    if [ ! -d "$ROOT_DIR/server/node_modules" ]; then
        echo "Missing bundled runtime dependencies. Use the release artifact built for this platform."
        exit 1
    fi
}

load_environment() {
    set -a
    . "$ENV_FILE"
    set +a

    export PORT="${PORT:-8001}"
}

validate_runtime_config() {
    for name in \
        NUXT_DATA_PATH \
        NUXT_PUBLIC_BASE_URL \
        NUXT_PUBLIC_SITE_TITLE \
        NUXT_PUBLIC_SITE_TITLE_SHORT \
        NUXT_SURREAL_INFO_TYPE \
        NUXT_SURREAL_INFO_URL \
        NUXT_SURREAL_INFO_NAMESPACE \
        NUXT_SURREAL_INFO_DATABASE; do
        if [ -z "${!name:-}" ]; then
            echo "Set $name in $ENV_FILE."
            exit 1
        fi
    done

    case "$NUXT_SURREAL_INFO_TYPE" in
        embedded)
            case "$NUXT_SURREAL_INFO_URL" in
                rocksdb://*) ;;
                *)
                    echo "NUXT_SURREAL_INFO_URL must use the rocksdb:// scheme for embedded mode."
                    exit 1
                    ;;
            esac
            ;;
        remote)
            for name in NUXT_SURREAL_INFO_USERNAME NUXT_SURREAL_INFO_PASSWORD; do
                if [ -z "${!name:-}" ]; then
                    echo "Set $name in $ENV_FILE for remote SurrealDB mode."
                    exit 1
                fi
            done

            case "$NUXT_SURREAL_INFO_URL" in
                */rpc) ;;
                *)
                    echo "NUXT_SURREAL_INFO_URL must point to a SurrealDB RPC endpoint in remote mode."
                    exit 1
                    ;;
            esac
            ;;
        *)
            echo "NUXT_SURREAL_INFO_TYPE must be either embedded or remote."
            exit 1
            ;;
    esac
}

validate_default_account_credentials() {
    ADMIN_EMAIL="${NUXT_SURREAL_ADMIN_EMAIL:-}"
    ADMIN_NAME="${NUXT_SURREAL_ADMIN_NAME:-}"
    ADMIN_PASSWORD="${NUXT_SURREAL_ADMIN_PASSWORD:-}"

    if [ -z "$ADMIN_EMAIL" ] && [ -z "$ADMIN_NAME" ] && [ -z "$ADMIN_PASSWORD" ]; then
        return
    fi

    if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_NAME" ] || [ -z "$ADMIN_PASSWORD" ]; then
        echo "Set all NUXT_SURREAL_ADMIN_* values for the default account, or leave all three blank when an account already exists."
        exit 1
    fi

    case "$ADMIN_PASSWORD" in
            admin123|change-this-password)
            echo "Replace the placeholder NUXT_SURREAL_ADMIN_PASSWORD before starting the service."
            exit 1
            ;;
    esac
}

prepare_data_paths() {
    mkdir -p "$NUXT_DATA_PATH"

    if [ "$NUXT_SURREAL_INFO_TYPE" = "embedded" ]; then
        DATABASE_PATH="${NUXT_SURREAL_INFO_URL#rocksdb://}"
        mkdir -p "$(dirname "$DATABASE_PATH")"
    fi
}

install_service() {
    SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"
    require_service_access

    NODE_BIN="${NODE_BIN:-$(command -v node)}"

    cat >"$SERVICE_FILE" <<SERVICE
[Unit]
Description=forum
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$ROOT_DIR
Environment=NODE_BIN=$NODE_BIN
Environment=ENV_FILE=$ENV_FILE
ExecStart=$ROOT_DIR/installer.sh run
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

    systemctl daemon-reload
    systemctl enable --now "$SERVICE_NAME"

    echo "Installed and started $SERVICE_NAME.service"
    echo "Check status with: ./installer.sh status"
    echo "Follow logs with: journalctl -u $SERVICE_NAME -f"
}

run_foreground() {
    echo "Starting forum on ${NUXT_PUBLIC_BASE_URL}"
    NODE_BIN="${NODE_BIN:-$(command -v node)}"
    exec "$NODE_BIN" "$SERVER_ENTRY"
}

setup_file_logging() {
    local log_file="$1"

    if ! command -v tee >/dev/null 2>&1 || ! (umask 077; mkdir -p "$LOG_DIR" && touch "$log_file") || ! chmod 600 "$log_file"; then
        echo "Unable to write log file $log_file; continuing without file logging." >&2
        return
    fi

    exec > >(tee -a "$log_file") 2>&1
}

backup_service_was_active=false

restore_backup_service() {
    local backup_exit_status=$?
    trap - EXIT

    if [ "$backup_service_was_active" = true ]; then
        if systemctl start "$SERVICE_NAME"; then
            echo "Restarted $SERVICE_NAME.service"
        else
            echo "Failed to restart $SERVICE_NAME.service after backup." >&2
            backup_exit_status=1
        fi
    fi

    exit "$backup_exit_status"
}

backup_embedded() {
    if [ ! -f "$ENV_FILE" ]; then
        echo "Missing environment file: $ENV_FILE" >&2
        exit 1
    fi

    load_environment

    if [ "${NUXT_SURREAL_INFO_TYPE:-}" = "remote" ]; then
        echo "Remote SurrealDB is not included in an installer backup. Use the SurrealDB CLI procedure in docs/Backups.md." >&2
        exit 1
    fi

    require_service_access

    if [ "${NUXT_SURREAL_INFO_TYPE:-}" != "embedded" ]; then
        echo "Installer backups require embedded SurrealDB mode." >&2
        exit 1
    fi

    case "${NUXT_SURREAL_INFO_URL:-}" in
        rocksdb://*) ;;
        *)
            echo "NUXT_SURREAL_INFO_URL must identify a rocksdb:// database directory." >&2
            exit 1
            ;;
    esac

    local database_path
    if [ "${NUXT_SURREAL_INFO_URL#rocksdb://}" = "" ]; then
        echo "NUXT_SURREAL_INFO_URL must identify a database directory." >&2
        exit 1
    fi
    database_path="${NUXT_SURREAL_INFO_URL#rocksdb://}"
    if [ "${database_path#/}" = "$database_path" ]; then
        database_path="$ROOT_DIR/$database_path"
    fi
    if [ ! -d "$database_path" ]; then
        echo "Embedded database directory not found: $database_path" >&2
        exit 1
    fi

    local environment_path
    local backup_directory
    local backup_timestamp
    local backup_archive
    local checksum_file
    local service_state

    database_path="$(realpath "$database_path")"
    environment_path="$(realpath "$ENV_FILE")"
    backup_directory="${BACKUP_DIR:-$(dirname "$environment_path")/backups}"
    mkdir -p "$backup_directory"
    chmod 700 "$backup_directory"
    backup_directory="$(realpath "$backup_directory")"

    service_state="$(systemctl is-active "$SERVICE_NAME" 2>/dev/null || true)"
    case "$service_state" in
        active)
            backup_service_was_active=true
            trap restore_backup_service EXIT
            echo "Stopping $SERVICE_NAME.service for a consistent embedded database backup"
            systemctl stop "$SERVICE_NAME"
            ;;
        inactive)
            echo "$SERVICE_NAME.service is not running"
            ;;
        *)
            echo "Cannot safely back up while $SERVICE_NAME.service is in state '$service_state'." >&2
            exit 1
            ;;
    esac

    umask 077
    backup_timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
    backup_archive="$backup_directory/classicforum-db-$backup_timestamp-$$.tar.gz"
    checksum_file="$backup_archive.sha256"

    tar -czf "$backup_archive" \
        -C "$(dirname "$database_path")" "$(basename "$database_path")"
    gzip -t "$backup_archive"
    tar -tzf "$backup_archive" >/dev/null
    (
        cd "$backup_directory"
        sha256sum "$(basename "$backup_archive")" >"$(basename "$checksum_file")"
    )
    chmod 600 "$backup_archive" "$checksum_file"

    echo "Created backup: $backup_archive"
    echo "Created checksum: $checksum_file"
}

restore_service_was_active=false
restore_temp_dir=""
restore_database_path=""
restore_rollback_path=""
restore_original_moved=false
restore_completed=false

finish_restore() {
    local restore_exit_status=$?
    trap - EXIT

    if [ "$restore_original_moved" = true ] && [ "$restore_completed" != true ] && [ ! -e "$restore_database_path" ]; then
        if mv "$restore_rollback_path" "$restore_database_path"; then
            echo "Restored the previous database after the restore operation failed."
        else
            echo "Failed to roll back the previous database at $restore_rollback_path." >&2
            restore_exit_status=1
        fi
    fi

    if [ -n "$restore_temp_dir" ] && [ -d "$restore_temp_dir" ]; then
        rm -rf -- "$restore_temp_dir"
    fi

    if [ "$restore_service_was_active" = true ]; then
        if systemctl start "$SERVICE_NAME"; then
            echo "Restarted $SERVICE_NAME.service"
        else
            echo "Failed to restart $SERVICE_NAME.service after restore." >&2
            restore_exit_status=1
        fi
    fi

    exit "$restore_exit_status"
}

restore_embedded() {
    local requested_archive="${1:-}"
    local environment_path
    local backup_directory
    local backup_archive
    local archive_contents
    local database_path
    local database_name
    local database_parent
    local staged_database
    local ownership_reference
    local service_state
    local member

    if [ ! -f "$ENV_FILE" ]; then
        echo "Missing environment file: $ENV_FILE" >&2
        exit 1
    fi

    load_environment

    if [ "${NUXT_SURREAL_INFO_TYPE:-}" != "embedded" ]; then
        echo "Installer restore requires embedded SurrealDB mode." >&2
        exit 1
    fi

    case "${NUXT_SURREAL_INFO_URL:-}" in
        rocksdb://*) ;;
        *)
            echo "NUXT_SURREAL_INFO_URL must identify a rocksdb:// database directory." >&2
            exit 1
            ;;
    esac

    database_path="${NUXT_SURREAL_INFO_URL#rocksdb://}"
    if [ -z "$database_path" ]; then
        echo "NUXT_SURREAL_INFO_URL must identify a database directory." >&2
        exit 1
    fi
    if [ "${database_path#/}" = "$database_path" ]; then
        database_path="$ROOT_DIR/$database_path"
    fi
    database_path="$(realpath -m "$database_path")"
    database_name="$(basename "$database_path")"
    if [ "$database_name" = "/" ] || [ "$database_name" = "." ]; then
        echo "NUXT_SURREAL_INFO_URL must identify a database directory, not its parent." >&2
        exit 1
    fi

    environment_path="$(realpath "$ENV_FILE")"
    backup_directory="${BACKUP_DIR:-$(dirname "$environment_path")/backups}"
    if [ ! -d "$backup_directory" ]; then
        echo "Backup directory not found: $backup_directory" >&2
        exit 1
    fi
    backup_directory="$(realpath "$backup_directory")"

    if [ -n "$requested_archive" ]; then
        backup_archive="$requested_archive"
    else
        local latest_archive_name
        latest_archive_name="$(find "$backup_directory" -maxdepth 1 -type f -name 'classicforum-db-*.tar.gz' -printf '%f\n' | LC_ALL=C sort -r | head -n 1)"
        if [ -z "$latest_archive_name" ]; then
            echo "No embedded database backups found in $backup_directory." >&2
            exit 1
        fi
        backup_archive="$backup_directory/$latest_archive_name"
    fi

    if [ ! -f "$backup_archive" ]; then
        echo "Backup archive not found: $backup_archive" >&2
        exit 1
    fi
    backup_archive="$(realpath "$backup_archive")"

    local checksum_file="$backup_archive.sha256"
    if [ ! -f "$checksum_file" ]; then
        echo "Backup checksum not found: $checksum_file" >&2
        exit 1
    fi
    (
        cd "$(dirname "$backup_archive")"
        sha256sum -c "$(basename "$checksum_file")"
    )
    gzip -t "$backup_archive"

    archive_contents="$(tar -tzf "$backup_archive")"
    if [ -z "$archive_contents" ]; then
        echo "Backup archive is empty: $backup_archive" >&2
        exit 1
    fi
    while IFS= read -r member; do
        case "$member" in
            "$database_name/"|"$database_name/"*) ;;
            *)
                echo "Backup archive contains an unexpected path: $member" >&2
                exit 1
                ;;
        esac
        case "$member" in
            /*|../*|*/../*|*/..|*//* )
                echo "Backup archive contains an unsafe path: $member" >&2
                exit 1
                ;;
        esac
    done <<< "$archive_contents"

    require_service_access

    database_parent="$(dirname "$database_path")"
    mkdir -p "$database_parent"
    restore_temp_dir="$(mktemp -d "$database_parent/.classicforum-restore.XXXXXX")"
    chmod 700 "$restore_temp_dir"
    restore_database_path="$database_path"
    restore_rollback_path="$database_path.before-restore-$(date -u +%Y%m%dT%H%M%SZ)-$$"
    trap finish_restore EXIT

    tar -xzf "$backup_archive" -C "$restore_temp_dir"
    staged_database="$restore_temp_dir/$database_name"
    if [ ! -d "$staged_database" ]; then
        echo "Backup does not contain the configured database directory: $database_name" >&2
        exit 1
    fi
    if [ -e "$database_path" ]; then
        ownership_reference="$database_path"
    else
        ownership_reference="$database_parent"
    fi
    chown -R --reference="$ownership_reference" "$staged_database"

    service_state="$(systemctl is-active "$SERVICE_NAME" 2>/dev/null || true)"
    case "$service_state" in
        active)
            restore_service_was_active=true
            echo "Stopping $SERVICE_NAME.service for database restore"
            systemctl stop "$SERVICE_NAME"
            ;;
        inactive)
            echo "$SERVICE_NAME.service is not running"
            ;;
        *)
            echo "Cannot safely restore while $SERVICE_NAME.service is in state '$service_state'." >&2
            exit 1
            ;;
    esac

    if [ -e "$database_path" ]; then
        if [ -e "$restore_rollback_path" ]; then
            echo "Rollback path already exists: $restore_rollback_path" >&2
            exit 1
        fi
        mv "$database_path" "$restore_rollback_path"
        restore_original_moved=true
    fi

    mv "$staged_database" "$database_path"
    restore_completed=true
    echo "Restored database from: $backup_archive"
    if [ "$restore_original_moved" = true ]; then
        echo "Previous database preserved at: $restore_rollback_path"
    fi
}

COMMAND="${1:-install}"

if [ "$COMMAND" = "run" ]; then
    setup_file_logging "$APP_LOG_FILE"
else
    setup_file_logging "$INSTALLER_LOG_FILE"
fi

case "$COMMAND" in
    install)
        if [ "$#" -gt 2 ] || { [ "$#" -eq 2 ] && [ "${2:-}" != "--no-service" ]; }; then
            usage
            exit 1
        fi
        local_install_service=true
        if [ "${2:-}" = "--no-service" ]; then
            local_install_service=false
        fi
        if [ "$local_install_service" = true ]; then
            stop_running_service
        fi
        ensure_environment_file
        require_runtime
        load_environment
        validate_runtime_config
        validate_default_account_credentials
        prepare_data_paths
        if [ "$local_install_service" = true ]; then
            install_service
        else
            echo "Prepared deployment without installing a systemd service. Start it with: ./installer.sh run"
        fi
        ;;
    run)
        ensure_environment_file
        require_runtime
        load_environment
        validate_runtime_config
        validate_default_account_credentials
        prepare_data_paths
        run_foreground
        ;;
    backup)
        backup_embedded
        ;;
    restore)
        if [ "$#" -gt 2 ]; then
            usage
            exit 1
        fi
        restore_embedded "${2:-}"
        ;;
    status)
        status_service
        ;;
    start)
        start_service
        ;;
    stop)
        stop_running_service
        ;;
    restart)
        restart_service
        ;;
    -h|--help|help)
        usage
        ;;
    *)
        usage
        exit 1
        ;;
esac