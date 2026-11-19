#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/../.env}"
ENV_EXAMPLE_FILE="$ROOT_DIR/.env.example"
SERVER_ENTRY="$ROOT_DIR/server/index.mjs"
SERVICE_NAME="${SERVICE_NAME:-forum}"
RELEASE_REPOSITORY="tcm151/dox"
LOG_DIR="$(dirname "$ENV_FILE")/logs"
INSTALLER_LOG_FILE="$LOG_DIR/installer.log"
APP_LOG_FILE="$LOG_DIR/forum.log"

cd "$ROOT_DIR"

usage() {
    cat <<USAGE
Usage: ./installer.sh [--help|--version] [install [--no-service]|versions [--available|--installed|--previous]|upgrade [version]|cleanup [--keep count] [--yes]|service {status|start|stop|restart}|run|backup|restore [archive]]

Commands:
    install   Stop any running service, then install and start it. This is the default.
              Use --no-service to prepare a disposable deployment without systemd.
    versions  List stable releases with --available, installed releases with --installed,
              or older installed releases with --previous. Defaults to --available.
    upgrade   Install the latest stable release, or a selected VERSION.
    cleanup   Remove older installed releases; prompts before deletion unless --yes is used.
              Use --keep N to retain rollback copies. Defaults to one previous release.
    service   Manage the systemd service: status, start, stop, or restart.
    run       Start the app in the foreground for debugging.
    backup    Create a verified backup of an embedded database deployment.
    restore   Restore the latest embedded database backup, or a specified archive.
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

acquire_deployment_lock() {
    local deployment_root="$1"
    local lock_file="$deployment_root/.classicforum-deployment.lock"
    local inherited_lock_file expected_lock_file

    if ! command -v flock >/dev/null 2>&1; then
        echo "flock is required to safely change this deployment." >&2
        exit 1
    fi

    if [ "${CLASSICFORUM_LOCK_FILE:-}" = "$lock_file" ] && [ -e "/proc/self/fd/9" ]; then
        expected_lock_file="$(realpath -m "$lock_file")"
        inherited_lock_file="$(readlink -f /proc/self/fd/9 2>/dev/null || true)"
        if [ "$inherited_lock_file" = "$expected_lock_file" ] && flock -n 9; then
            return
        fi
    fi

    umask 077
    if ! exec 9>>"$lock_file"; then
        echo "Unable to open deployment lock: $lock_file" >&2
        exit 1
    fi
    if ! flock -n 9; then
        echo "Another install, upgrade, or cleanup is already running for $deployment_root." >&2
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

list_available_versions() (
    local current_version node_binary page release_json page_count
    current_version="$(basename "$ROOT_DIR")"
    if [[ ! "$current_version" =~ ^[0-9]{4}\.[0-9]+\.[0-9]+$ ]]; then
        current_version=""
    fi
    node_binary="${NODE_BIN:-$(command -v node || true)}"
    if [ -z "$node_binary" ] || [ ! -x "$node_binary" ]; then
        echo "Node.js is required to parse release metadata." >&2
        exit 1
    fi
    if ! command -v curl >/dev/null 2>&1; then
        echo "curl is required to list published releases." >&2
        exit 1
    fi

    if [ -n "$current_version" ]; then
        printf 'Stable Linux x64 releases (installed: %s):\n' "$current_version"
    else
        printf 'Stable Linux x64 releases:\n'
    fi
    page=1
    while true; do
        if ! release_json="$(curl --proto '=https' --proto-redir '=https' --fail --location --silent --show-error --connect-timeout 15 --max-time 60 --retry 3 --header 'Accept: application/vnd.github+json' "https://api.github.com/repos/$RELEASE_REPOSITORY/releases?per_page=100&page=$page")"; then
            echo "Unable to fetch release metadata from GitHub." >&2
            exit 1
        fi

        if ! page_count="$(printf '%s' "$release_json" | "$node_binary" -e '
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", chunk => { input += chunk; });
process.stdin.on("end", () => {
    try {
        const releases = JSON.parse(input);
        if (!Array.isArray(releases)) throw new Error("release list is not an array");
        process.stdout.write(String(releases.length));
    }
    catch (error) {
        console.error(`Invalid release list: ${error.message}`);
        process.exitCode = 1;
    }
});
')"; then
            echo "Unable to parse the GitHub release list." >&2
            exit 1
        fi

        printf '%s' "$release_json" | CURRENT_VERSION="$current_version" "$node_binary" -e '
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", chunk => { input += chunk; });
process.stdin.on("end", () => {
    try {
        const releases = JSON.parse(input);
        for (const release of releases) {
            const match = /^v(\d{4}\.\d+\.\d+)$/.exec(release.tag_name || "");
            if (release.draft || release.prerelease || !match) continue;
            const version = match[1];
            const archive = `forum-${version}-linux-x64.tar.gz`;
            const checksum = `${archive}.sha256`;
            if (![archive, checksum].every(name => release.assets?.some(asset => asset.name === name && asset.state === "uploaded"))) continue;
            let state = "";
            if (process.env.CURRENT_VERSION) {
                if (version === process.env.CURRENT_VERSION) {
                    state = " (installed)";
                }
                else {
                    const compare = (left, right) => {
                        const a = left.split(".").map(Number);
                        const b = right.split(".").map(Number);
                        for (let index = 0; index < a.length; index += 1) {
                            if (a[index] !== b[index]) return a[index] < b[index] ? -1 : 1;
                        }
                        return 0;
                    };
                    state = compare(version, process.env.CURRENT_VERSION) > 0 ? " (upgrade)" : " (older; not upgradeable)";
                }
            }
            process.stdout.write(`${version}${state}\n`);
        }
    }
    catch (error) {
        console.error(`Invalid release list: ${error.message}`);
        process.exitCode = 1;
    }
});
'

        if ((page_count < 100)); then
            break
        fi
        page=$((page + 1))
    done
)

list_installed_versions() (
    local deployment_root current_release service_release candidate version state
    local -a release_directories=()
    deployment_root="$(cd "$(dirname "$ROOT_DIR")" && pwd -P)"
    current_release="$(realpath -e -- "$ROOT_DIR")"
    service_release=""
    if command -v systemctl >/dev/null 2>&1; then
        service_release="$(systemctl show "$SERVICE_NAME" --property=WorkingDirectory --value 2>/dev/null || true)"
        if [ -n "$service_release" ] && [ -d "$service_release" ]; then
            service_release="$(realpath -e -- "$service_release")"
        else
            service_release=""
        fi
    fi

    mapfile -t release_directories < <(find_release_directories "$deployment_root")
    if [ "${#release_directories[@]}" -eq 0 ]; then
        echo "No installed release directories found."
        exit 0
    fi

    for candidate in "${release_directories[@]}"; do
        candidate="$(realpath -e -- "$candidate")"
        version="$(basename "$candidate")"
        state=""
        if [ "$candidate" = "$service_release" ]; then
            state=" (service)"
        fi
        if [ "$candidate" = "$current_release" ]; then
            state="${state} (current)"
        fi
        printf '%s%s\n' "$version" "$state"
    done
)

upgrade_release() (
    require_service_access

    local requested_version current_version deployment_root resolved_env_file node_binary release_json release_endpoint latest_version version_relation archive_name checksum_name release_url work_dir archive_path checksum_path checksum_entry checksum_hash checksum_asset_name archive_listing member staged_release target_release health_port health_response attempt configured_release
    requested_version="${1:-latest}"
    current_version="$(basename "$ROOT_DIR")"
    if [[ ! "$current_version" =~ ^[0-9]{4}\.[0-9]+\.[0-9]+$ ]]; then
        echo "Run upgrade from an installed versioned release directory." >&2
        exit 1
    fi
    if [ "$requested_version" = "latest" ]; then
        release_endpoint="latest"
    elif [[ "$requested_version" =~ ^[0-9]{4}\.[0-9]+\.[0-9]+$ ]]; then
        release_endpoint="tags/v$requested_version"
    else
        echo "Specify a release version in YYYY.major.patch format, or 'latest'." >&2
        exit 1
    fi

    if [ ! -f "$SERVER_ENTRY" ]; then
        echo "Missing current release server entrypoint: $SERVER_ENTRY" >&2
        exit 1
    fi

    if [ ! -f "$ENV_FILE" ]; then
        echo "Missing shared environment file: $ENV_FILE" >&2
        exit 1
    fi
    resolved_env_file="$(realpath -e -- "$ENV_FILE")"

    if [ ! -f "/etc/systemd/system/$SERVICE_NAME.service" ]; then
        echo "Missing /etc/systemd/system/$SERVICE_NAME.service; install this deployment before upgrading." >&2
        exit 1
    fi

    node_binary="${NODE_BIN:-$(command -v node || true)}"
    if [ -z "$node_binary" ] || [ ! -x "$node_binary" ]; then
        echo "Node.js is required to validate release metadata and readiness." >&2
        exit 1
    fi
    for tool in curl sha256sum tar realpath mktemp; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            echo "$tool is required to upgrade this deployment." >&2
            exit 1
        fi
    done

    deployment_root="$(cd "$(dirname "$ROOT_DIR")" && pwd -P)"
    acquire_deployment_lock "$deployment_root"
    echo "Checking release '$requested_version' from $RELEASE_REPOSITORY"
    if ! release_json="$(curl --proto '=https' --proto-redir '=https' --fail --location --silent --show-error --connect-timeout 15 --max-time 60 --retry 3 --header 'Accept: application/vnd.github+json' "https://api.github.com/repos/$RELEASE_REPOSITORY/releases/$release_endpoint")"; then
        echo "Unable to fetch release metadata from GitHub." >&2
        exit 1
    fi

    if ! latest_version="$(printf '%s' "$release_json" | REQUESTED_VERSION="$requested_version" "$node_binary" -e '
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", chunk => { input += chunk; });
process.stdin.on("end", () => {
    try {
        const release = JSON.parse(input);
        const match = /^v(\d{4}\.\d+\.\d+)$/.exec(release.tag_name || "");
        if (release.draft || release.prerelease || !match) {
            throw new Error("latest release is not a stable versioned release");
        }

        const version = match[1];
        if (process.env.REQUESTED_VERSION !== "latest" && process.env.REQUESTED_VERSION !== version) {
            throw new Error("release tag does not match the requested version");
        }
        for (const name of [`forum-${version}-linux-x64.tar.gz`, `forum-${version}-linux-x64.tar.gz.sha256`]) {
            if (!release.assets?.some(asset => asset.name === name && asset.state === "uploaded")) {
                throw new Error(`release is missing uploaded asset ${name}`);
            }
        }

        process.stdout.write(version);
    }
    catch (error) {
        console.error(`Invalid latest release metadata: ${error.message}`);
        process.exitCode = 1;
    }
});
')"; then
        echo "Selected release metadata is invalid or does not include the Linux x64 archive and checksum." >&2
        exit 1
    fi

    if ! version_relation="$(CURRENT_VERSION="$current_version" LATEST_VERSION="$latest_version" "$node_binary" -e '
const parse = value => {
    if (!/^\d{4}\.\d+\.\d+$/.test(value)) throw new Error("invalid version");
    return value.split(".").map(Number);
};
const current = parse(process.env.CURRENT_VERSION);
const latest = parse(process.env.LATEST_VERSION);
let comparison = 0;
for (let index = 0; index < current.length; index += 1) {
    if (current[index] !== latest[index]) {
        comparison = current[index] < latest[index] ? -1 : 1;
        break;
    }
}
process.stdout.write(comparison === 0 ? "same" : comparison < 0 ? "older" : "newer");
')"; then
        echo "Unable to compare installed and published release versions." >&2
        exit 1
    fi

    case "$version_relation" in
        same)
            echo "Already running the latest stable release: $current_version"
            exit 0
            ;;
        older) ;;
        newer)
            echo "Refusing to downgrade from $current_version to older published release $latest_version." >&2
            exit 1
            ;;
        *)
            echo "Unable to compare installed and published release versions." >&2
            exit 1
            ;;
    esac

    target_release="$deployment_root/$latest_version"
    if [ -e "$target_release" ] || [ -L "$target_release" ]; then
        echo "Release target already exists; refusing to overwrite it: $target_release" >&2
        exit 1
    fi

    archive_name="forum-$latest_version-linux-x64.tar.gz"
    checksum_name="$archive_name.sha256"
    release_url="https://github.com/$RELEASE_REPOSITORY/releases/download/v$latest_version"
    work_dir="$(mktemp -d "$deployment_root/.classicforum-upgrade.XXXXXX")"
    trap 'rm -rf -- "$work_dir"' EXIT
    archive_path="$work_dir/$archive_name"
    checksum_path="$work_dir/$checksum_name"

    echo "Downloading $archive_name"
    curl --proto '=https' --proto-redir '=https' --fail --location --silent --show-error --connect-timeout 15 --max-time 300 --retry 3 --output "$archive_path" "$release_url/$archive_name"
    curl --proto '=https' --proto-redir '=https' --fail --location --silent --show-error --connect-timeout 15 --max-time 60 --retry 3 --output "$checksum_path" "$release_url/$checksum_name"

    checksum_entry="$(<"$checksum_path")"
    if [[ "$checksum_entry" == *$'\n'* ]]; then
        echo "Release checksum file must contain one entry." >&2
        exit 1
    fi
    read -r checksum_hash checksum_asset_name <<<"$checksum_entry"
    if [[ ! "$checksum_hash" =~ ^[[:xdigit:]]{64}$ ]] || [ "$checksum_asset_name" != "$archive_name" ]; then
        echo "Release checksum file does not match $archive_name." >&2
        exit 1
    fi
    (
        cd "$work_dir"
        sha256sum -c "$checksum_name"
    )

    if ! archive_listing="$(tar -tzf "$archive_path")" || [ -z "$archive_listing" ]; then
        echo "Unable to read the downloaded release archive." >&2
        exit 1
    fi
    while IFS= read -r member; do
        case "$member" in
            "forum/$latest_version/"|"forum/$latest_version/"*) ;;
            *)
                echo "Release archive contains an unexpected path: $member" >&2
                exit 1
                ;;
        esac
        case "$member" in
            /*|../*|*/../*|*/..|*/./*|*/./|*//* )
                echo "Release archive contains an unsafe path: $member" >&2
                exit 1
                ;;
        esac
    done <<<"$archive_listing"

    mkdir "$work_dir/unpack"
    tar --no-same-owner -xzf "$archive_path" -C "$work_dir/unpack"
    staged_release="$work_dir/unpack/forum/$latest_version"
    if [ ! -x "$staged_release/installer.sh" ] || [ ! -f "$staged_release/server/index.mjs" ]; then
        echo "Release archive is missing its installer or server entrypoint." >&2
        exit 1
    fi

    mv -- "$staged_release" "$target_release"
    echo "Installing release $latest_version"
    rm -rf -- "$work_dir"
    trap - EXIT
    if ! ENV_FILE="$resolved_env_file" SERVICE_NAME="$SERVICE_NAME" NODE_BIN="$node_binary" CLASSICFORUM_LOCK_FILE="$deployment_root/.classicforum-deployment.lock" "$target_release/installer.sh" install; then
        report_upgrade_failure "The installer could not activate release $latest_version."
        exit 1
    fi

    health_port="$(ENV_FILE="$resolved_env_file" "$BASH" -c 'set -a; . "$ENV_FILE"; set +a; printf "%s" "${PORT:-8001}"')"
    if [[ ! "$health_port" =~ ^[0-9]{1,5}$ ]] || (( 10#$health_port < 1 || 10#$health_port > 65535 )); then
        report_upgrade_failure "Invalid application PORT in $resolved_env_file; release $latest_version was installed but readiness could not be checked."
        exit 1
    fi

    for attempt in {1..30}; do
        if health_response="$(curl --fail --silent --show-error --max-time 5 "http://127.0.0.1:$health_port/api/health" 2>/dev/null)" && \
            printf '%s' "$health_response" | EXPECTED_VERSION="$latest_version" "$node_binary" -e '
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", chunk => { input += chunk; });
process.stdin.on("end", () => {
    try {
        const health = JSON.parse(input);
        if (health.app === "ready" && health.database === "ready" && health.version === process.env.EXPECTED_VERSION) {
            process.exit(0);
        }
    }
    catch {}
    process.exit(1);
});
'; then
            echo "Upgrade to $latest_version is healthy; app and database are ready."
            exit 0
        fi
        sleep 2
    done

    report_upgrade_failure "Release $latest_version was installed, but readiness did not report the expected app and database version."
    exit 1
)

report_upgrade_failure() {
    local reason="$1" configured_release
    echo "$reason" >&2
    configured_release="$(systemctl show "$SERVICE_NAME" --property=WorkingDirectory --value 2>/dev/null || true)"
    if [ -n "$configured_release" ]; then
        echo "Systemd is configured to run: $configured_release" >&2
    fi
    echo "No automatic rollback was attempted because startup may already have applied database migrations." >&2
    echo "Do not start an older release until the database has been restored to a compatible backup." >&2
    echo "Inspect service logs with: journalctl -u $SERVICE_NAME -n 50 --no-pager" >&2
}

version_is_older() {
    local candidate_version="$1" reference_version="$2"
    local candidate_year candidate_major candidate_patch reference_year reference_major reference_patch

    if [[ ! "$candidate_version" =~ ^([0-9]{4})\.([0-9]+)\.([0-9]+)$ ]]; then
        return 1
    fi
    candidate_year="${BASH_REMATCH[1]}"
    candidate_major="${BASH_REMATCH[2]}"
    candidate_patch="${BASH_REMATCH[3]}"

    if [[ ! "$reference_version" =~ ^([0-9]{4})\.([0-9]+)\.([0-9]+)$ ]]; then
        return 1
    fi
    reference_year="${BASH_REMATCH[1]}"
    reference_major="${BASH_REMATCH[2]}"
    reference_patch="${BASH_REMATCH[3]}"

    if ((10#$candidate_year < 10#$reference_year)); then return 0; fi
    if ((10#$candidate_year > 10#$reference_year)); then return 1; fi
    if ((10#$candidate_major < 10#$reference_major)); then return 0; fi
    if ((10#$candidate_major > 10#$reference_major)); then return 1; fi
    ((10#$candidate_patch < 10#$reference_patch))
}

find_release_directories() (
    local deployment_root="$1" candidate release_name
    for candidate in "$deployment_root"/*; do
        [ -d "$candidate" ] && [ ! -L "$candidate" ] || continue
        release_name="$(basename "$candidate")"
        [[ "$release_name" =~ ^[0-9]{4}\.[0-9]+\.[0-9]+$ ]] || continue
        [ -x "$candidate/installer.sh" ] && [ -f "$candidate/server/index.mjs" ] || continue
        printf '%s\n' "$candidate"
    done | sort -Vr
)

release_cleanup_context() {
    local deployment_root="$1" service_release

    if [[ ! "$(basename "$ROOT_DIR")" =~ ^[0-9]{4}\.[0-9]+\.[0-9]+$ ]]; then
        echo "Run this command from an installed versioned release directory." >&2
        return 1
    fi

    CURRENT_RELEASE="$(realpath -e -- "$ROOT_DIR")"
    service_release=""
    if command -v systemctl >/dev/null 2>&1; then
        service_release="$(systemctl show "$SERVICE_NAME" --property=WorkingDirectory --value 2>/dev/null || true)"
    fi
    if [ -n "$service_release" ] && [ -d "$service_release" ]; then
        service_release="$(realpath -e -- "$service_release")"
        case "$service_release" in
            "$deployment_root"/*) ;;
            *) service_release="" ;;
        esac
    else
        service_release=""
    fi

    if [ -n "$service_release" ] && [[ "$(basename "$service_release")" =~ ^[0-9]{4}\.[0-9]+\.[0-9]+$ ]]; then
        REFERENCE_RELEASE="$service_release"
    else
        REFERENCE_RELEASE="$CURRENT_RELEASE"
    fi
}

list_previous_versions() (
    local deployment_root candidate candidate_version found=false
    local -a release_directories=()
    deployment_root="$(cd "$(dirname "$ROOT_DIR")" && pwd -P)"
    release_cleanup_context "$deployment_root"
    mapfile -t release_directories < <(find_release_directories "$deployment_root")

    for candidate in "${release_directories[@]}"; do
        candidate="$(realpath -e -- "$candidate")"
        if [ "$candidate" = "$CURRENT_RELEASE" ] || [ "$candidate" = "$REFERENCE_RELEASE" ]; then
            continue
        fi
        candidate_version="$(basename "$candidate")"
        if version_is_older "$candidate_version" "$(basename "$REFERENCE_RELEASE")"; then
            printf '%s\n' "$candidate_version"
            found=true
        fi
    done

    if [ "$found" = false ]; then
        echo "No older installed release directories found."
    fi
)

cleanup_versions() (
    local keep_count=1 assume_yes=false deployment_root candidate candidate_version retained_count=0 confirmation
    local -a release_directories=()
    local -a releases_to_remove=()
    while [ "$#" -gt 0 ]; do
        case "$1" in
            --keep)
                if [ "$#" -lt 2 ] || [[ ! "$2" =~ ^[0-9]{1,3}$ ]]; then
                    echo "Usage: ./installer.sh cleanup [--keep count] [--yes]" >&2
                    exit 1
                fi
                keep_count=$((10#$2))
                shift 2
                ;;
            --yes)
                assume_yes=true
                shift
                ;;
            *)
                echo "Usage: ./installer.sh cleanup [--keep count] [--yes]" >&2
                exit 1
                ;;
        esac
    done

    deployment_root="$(cd "$(dirname "$ROOT_DIR")" && pwd -P)"
    require_service_access
    if [ ! -f "/etc/systemd/system/$SERVICE_NAME.service" ]; then
        echo "Missing /etc/systemd/system/$SERVICE_NAME.service; refusing to remove release directories." >&2
        exit 1
    fi
    acquire_deployment_lock "$deployment_root"
    release_cleanup_context "$deployment_root"
    mapfile -t release_directories < <(find_release_directories "$deployment_root")

    for candidate in "${release_directories[@]}"; do
        candidate="$(realpath -e -- "$candidate")"
        if [ "$candidate" = "$CURRENT_RELEASE" ] || [ "$candidate" = "$REFERENCE_RELEASE" ]; then
            continue
        fi
        candidate_version="$(basename "$candidate")"
        if ! version_is_older "$candidate_version" "$(basename "$REFERENCE_RELEASE")"; then
            echo "Keeping non-previous release: $candidate_version"
            continue
        fi
        if ((retained_count < keep_count)); then
            echo "Keeping previous release: $candidate"
            retained_count=$((retained_count + 1))
            continue
        fi

        case "$candidate" in
            "$deployment_root"/*) ;;
            *)
                echo "Refusing to remove a path outside the deployment root: $candidate" >&2
                exit 1
                ;;
        esac
        releases_to_remove+=("$candidate")
    done

    if [ "${#releases_to_remove[@]}" -eq 0 ]; then
        echo "No older release directories to remove."
        exit 0
    fi

    printf 'Older release directories to remove:\n'
    printf '  %s\n' "${releases_to_remove[@]}"
    if [ "$assume_yes" != true ]; then
        if [ ! -t 0 ]; then
            echo "Cleanup requires interactive confirmation; pass --yes to run non-interactively." >&2
            exit 1
        fi
        printf 'Remove %s older release(s)? [y/N] ' "${#releases_to_remove[@]}"
        read -r confirmation
        case "$confirmation" in
            y|Y|yes|YES) ;;
            *)
                echo "Cleanup cancelled."
                exit 0
                ;;
        esac
    fi

    for candidate in "${releases_to_remove[@]}"; do
        rm -rf -- "$candidate"
        echo "Removed old release: $candidate"
    done
    if ((keep_count > 0)); then
        echo "Retained $retained_count previous release(s)."
    fi
)

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
    echo "Check status with: ./installer.sh service status"
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
        acquire_deployment_lock "$(cd "$(dirname "$ROOT_DIR")" && pwd -P)"
        ensure_environment_file
        require_runtime
        load_environment
        validate_runtime_config
        validate_default_account_credentials
        prepare_data_paths
        if [ "$local_install_service" = true ]; then
            stop_running_service
            install_service
        else
            echo "Prepared deployment without installing a systemd service. Start it with: ./installer.sh run"
        fi
        ;;
    versions)
        if [ "$#" -gt 2 ]; then
            usage
            exit 1
        fi
        case "${2:---available}" in
            --available) list_available_versions ;;
            --installed) list_installed_versions ;;
            --previous) list_previous_versions ;;
            *)
                usage
                exit 1
                ;;
        esac
        ;;
    upgrade)
        if [ "$#" -gt 2 ]; then
            usage
            exit 1
        fi
        upgrade_release "${2:-latest}"
        ;;
    cleanup)
        cleanup_versions "${@:2}"
        ;;
    service)
        if [ "$#" -ne 2 ]; then
            usage
            exit 1
        fi
        case "$2" in
            status) status_service ;;
            start) start_service ;;
            stop) stop_running_service ;;
            restart) restart_service ;;
            *)
                usage
                exit 1
                ;;
        esac
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
    --version)
        release_version="$(basename "$ROOT_DIR")"
        if [[ "$release_version" =~ ^[0-9]{4}\.[0-9]+\.[0-9]+$ ]]; then
            printf 'ClassicForum %s\n' "$release_version"
        else
            printf 'ClassicForum installer (unversioned checkout)\n'
        fi
        ;;
    *)
        usage
        exit 1
        ;;
esac