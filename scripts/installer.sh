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
    if ! command -v node >/dev/null 2>&1; then
        echo "Node.js is required. Install a current Node.js LTS release, then run this script again."
        exit 1
    fi

    if [ ! -f "$SERVER_ENTRY" ]; then
        echo "Missing server entrypoint: $SERVER_ENTRY"
        echo "Use a staged release artifact that includes server/index.mjs."
        exit 1
    fi
}

load_environment() {
    set -a
    . "$ENV_FILE"
    set +a
}

prepare_data_paths() {
    DATA_PATH="${DATA_PATH:-../data}"
    mkdir -p "$DATA_PATH"

    if [ "${SURREAL_TYPE:-}" = "embedded" ] && [ -n "${SURREAL_URL:-}" ]; then
        DATABASE_PATH="${SURREAL_URL#rocksdb://}"
        if [ "$DATABASE_PATH" != "$SURREAL_URL" ]; then
            mkdir -p "$(dirname "$DATABASE_PATH")"
        fi
    fi
}

install_service() {
    SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"
    require_service_access

    NODE_BIN="$(command -v node)"

    cat >"$SERVICE_FILE" <<SERVICE
[Unit]
Description=forum
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$ROOT_DIR
EnvironmentFile=$ENV_FILE
ExecStart=$NODE_BIN $SERVER_ENTRY
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
    echo "Starting forum on ${BASE_URL:-http://localhost:${PORT:-8001}}"
    exec node "$SERVER_ENTRY"
}

COMMAND="${1:-install}"

case "$COMMAND" in
    install)
        stop_running_service
        ensure_environment_file
        require_runtime
        load_environment
        prepare_data_paths
        install_service
        ;;
    run)
        ensure_environment_file
        require_runtime
        load_environment
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