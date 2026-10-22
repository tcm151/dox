#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/../.env}"
ENV_EXAMPLE_FILE="$ROOT_DIR/.env.example"
SERVER_ENTRY="$ROOT_DIR/server/index.mjs"
SERVICE_NAME="${SERVICE_NAME:-forum}"

cd "$ROOT_DIR"

usage() {
    cat <<USAGE
Usage: ./installer.sh [install|run|status|stop|restart]

Commands:
    install   Stop any running service, then install and start it. This is the default.
    run       Start the app in the foreground for debugging.
    status    Show the systemd service status.
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

COMMAND="${1:-install}"

case "$COMMAND" in
    install)
        stop_running_service
        ensure_environment_file
        require_runtime
        load_environment
        validate_runtime_config
        validate_default_account_credentials
        prepare_data_paths
        install_service
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
    status)
        status_service
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