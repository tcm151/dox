#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

if [ "$EUID" -ne 0 ]; then
    echo "Run installer behavior tests as root; CI invokes this script with sudo." >&2
    exit 1
fi

for tool in flock node tar sha256sum realpath; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        echo "$tool is required to test the release installer." >&2
        exit 1
    fi
done

NODE_BINARY="$(command -v node)"
TEST_ROOT="$(mktemp -d)"
SERVICE_NAME="classicforum-installer-test-$$"
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"
SERVICE_FILE_CREATED=false
SECOND_DEPLOYMENT_ROOT=""
SECOND_SERVICE_FILE=""
SECOND_SERVICE_FILE_CREATED=false
cleanup_test_files() {
    rm -rf -- "$TEST_ROOT"
    if [ "$SERVICE_FILE_CREATED" = true ]; then
        rm -f -- "$SERVICE_FILE"
    fi
    if [ "$SECOND_SERVICE_FILE_CREATED" = true ]; then
        rm -f -- "$SECOND_SERVICE_FILE"
    fi
}
trap cleanup_test_files EXIT

if [ -e "$SERVICE_FILE" ] || [ -L "$SERVICE_FILE" ]; then
    echo "Refusing to overwrite an existing test service file: $SERVICE_FILE" >&2
    exit 1
fi
if ! (set -o noclobber; : > "$SERVICE_FILE"); then
    echo "Unable to create test service file: $SERVICE_FILE" >&2
    exit 1
fi
SERVICE_FILE_CREATED=true

MOCK_BIN="$TEST_ROOT/bin"
FIXTURE="$TEST_ROOT/fixture"
DEPLOYMENT_ROOT="$TEST_ROOT/forum"
CURRENT_RELEASE="$DEPLOYMENT_ROOT/2026.6.3"
ENV_FILE="$TEST_ROOT/.env"
LOCK_FILE="$DEPLOYMENT_ROOT/.classicforum-deployment.lock"
CURL_LOG="$FIXTURE/curl.log"
mkdir -p "$MOCK_BIN" "$FIXTURE" "$CURRENT_RELEASE/server/node_modules"

cat > "$ENV_FILE" <<ENVIRONMENT
PORT=8001
NUXT_DATA_PATH=$(printf '%q' "$TEST_ROOT/data")
NUXT_PUBLIC_BASE_URL=https://forum.example.test
NUXT_PUBLIC_SITE_TITLE="Installer Test"
NUXT_PUBLIC_SITE_TITLE_SHORT=Test
NUXT_SURREAL_INFO_TYPE=remote
NUXT_SURREAL_INFO_URL=https://db.example.test/rpc
NUXT_SURREAL_INFO_NAMESPACE=installer_test
NUXT_SURREAL_INFO_DATABASE=installer_test
NUXT_SURREAL_INFO_USERNAME=installer_test
NUXT_SURREAL_INFO_PASSWORD=installer_test
ENVIRONMENT

create_release() {
    local release_directory="$1"
    mkdir -p "$release_directory/server/node_modules"
    cp "$REPO_ROOT/scripts/installer.sh" "$release_directory/installer.sh"
    chmod +x "$release_directory/installer.sh"
    printf 'process.exit(0);\n' > "$release_directory/server/index.mjs"
    printf 'PORT=8001\n' > "$release_directory/.env.example"
}

create_placeholder_release() {
    local release_directory="$1"
    mkdir -p "$release_directory/server"
    printf '#!/usr/bin/env bash\nexit 0\n' > "$release_directory/installer.sh"
    chmod +x "$release_directory/installer.sh"
    printf 'placeholder\n' > "$release_directory/server/index.mjs"
}

create_release "$CURRENT_RELEASE"
for version in 2026.6.2 2026.6.1 2026.6.0 2026.6.5; do
    create_placeholder_release "$DEPLOYMENT_ROOT/$version"
done

cat > "$MOCK_BIN/systemctl" <<'SYSTEMCTL'
#!/usr/bin/env bash
set -euo pipefail
case "${1:-}" in
    is-active) exit 3 ;;
    show) printf '%s' "${INSTALLER_TEST_SERVICE_DIR:-}" ;;
    daemon-reload) exit 0 ;;
    enable)
        if [ "$#" -ne 3 ] || [ "$2" != "--now" ] || [ "$3" != "$SERVICE_NAME" ]; then
            printf 'Unexpected systemctl enable command: %s\n' "$*" >&2
            exit 1
        fi
        service_file="/etc/systemd/system/$SERVICE_NAME.service"
        expected_release="${INSTALLER_TEST_EXPECTED_SERVICE_DIR:?}"
        if ! grep -Fxq "WorkingDirectory=$expected_release" "$service_file" ||
            ! grep -Fxq "Environment=SERVICE_NAME=$SERVICE_NAME" "$service_file" ||
            ! grep -Fxq "ExecStart=$expected_release/installer.sh run" "$service_file"; then
            echo "Systemd unit does not point to the expected release." >&2
            exit 1
        fi
        printf '%s\n' "$expected_release" > "$INSTALLER_TEST_ACTIVE_RELEASE"
        ;;
    *)
        printf 'Unexpected systemctl command: %s\n' "$*" >&2
        exit 1
        ;;
esac
SYSTEMCTL

cat > "$MOCK_BIN/curl" <<'CURL'
#!/usr/bin/env bash
set -euo pipefail
url="${!#}"
printf '%s\n' "$url" >> "$INSTALLER_TEST_CURL_LOG"

copy_download() {
    local source="$1" output_file="" argument
    while [ "$#" -gt 1 ]; do
        argument="$1"
        if [ "$argument" = "--output" ]; then
            output_file="$2"
            shift 2
        else
            shift
        fi
    done
    if [ -z "$output_file" ]; then
        echo "curl download did not specify --output." >&2
        exit 1
    fi
    cp "$source" "$output_file"
}

case "$url" in
    https://api.github.com/repos/tcm151/dox/releases/tags/v2026.6.4)
        cat "$INSTALLER_TEST_FIXTURE/release.json"
        ;;
    https://github.com/tcm151/dox/releases/download/v2026.6.4/forum-2026.6.4-linux-x64.tar.gz.sha256)
        copy_download "$INSTALLER_TEST_FIXTURE/forum-2026.6.4-linux-x64.tar.gz.sha256" "$@"
        ;;
    https://github.com/tcm151/dox/releases/download/v2026.6.4/forum-2026.6.4-linux-x64.tar.gz)
        copy_download "$INSTALLER_TEST_FIXTURE/forum-2026.6.4-linux-x64.tar.gz" "$@"
        ;;
    http://127.0.0.1:8001/api/health)
        if [ ! -f "$INSTALLER_TEST_ACTIVE_RELEASE" ] ||
            [ "$(cat "$INSTALLER_TEST_ACTIVE_RELEASE")" != "$INSTALLER_TEST_EXPECTED_SERVICE_DIR" ]; then
            echo "Mock service was not enabled with the expected release." >&2
            exit 1
        fi
        printf '{"app":"ready","database":"ready","version":"2026.6.4"}\n'
        ;;
    *)
        printf 'Unexpected curl URL: %s\n' "$url" >&2
        exit 1
        ;;
esac
CURL

cat > "$MOCK_BIN/ss" <<'SS'
#!/usr/bin/env bash
set -euo pipefail
if [ -n "${INSTALLER_TEST_BUSY_PORT:-}" ] && [[ "$*" == *":$INSTALLER_TEST_BUSY_PORT"* ]]; then
    printf 'LISTEN 0 128 127.0.0.1:%s 0.0.0.0:*\n' "$INSTALLER_TEST_BUSY_PORT"
fi
SS

chmod +x "$MOCK_BIN/systemctl" "$MOCK_BIN/curl" "$MOCK_BIN/ss"

run_success() {
    local output_file="$1"
    shift
    if ! "$@" > "$output_file" 2>&1; then
        cat "$output_file" >&2
        echo "Expected command to succeed: $*" >&2
        return 1
    fi
}

create_archive() {
    local archive_root="$1"
    shift
    tar -czf "$FIXTURE/$ARCHIVE_NAME" -C "$archive_root" "$@"
    (cd "$FIXTURE" && sha256sum "$ARCHIVE_NAME" > "$ARCHIVE_NAME.sha256")
}

expect_upgrade_rejection() {
    local output_file="$1" expected_message="$2"
    if env "${LOCK_ENV[@]}" "$CURRENT_RELEASE/installer.sh" upgrade 2026.6.4 > "$output_file" 2>&1; then
        cat "$output_file" >&2
        echo "Expected upgrade to reject the release fixture." >&2
        return 1
    fi
    if ! grep -Fq "$expected_message" "$output_file"; then
        cat "$output_file" >&2
        echo "Upgrade failed without reporting the expected error: $expected_message" >&2
        return 1
    fi
    if [ -e "$DEPLOYMENT_ROOT/2026.6.4" ] || [ -L "$DEPLOYMENT_ROOT/2026.6.4" ]; then
        echo "Rejected upgrade left a release directory behind." >&2
        return 1
    fi
}

expect_lock_conflict() {
    local output_file="$1"
    shift
    if flock -n "$LOCK_FILE" "$@" > "$output_file" 2>&1; then
        cat "$output_file" >&2
        echo "Expected command to be rejected by the deployment lock: $*" >&2
        return 1
    fi
    if ! grep -Fq "Another install, upgrade, or cleanup is already running" "$output_file"; then
        cat "$output_file" >&2
        echo "Command failed without reporting a deployment lock conflict: $*" >&2
        return 1
    fi
}

TEST_PATH="$MOCK_BIN:$PATH"
SERVICE_RELEASE="$DEPLOYMENT_ROOT/2026.6.2"
EXPECTED_SERVICE_RELEASE="$DEPLOYMENT_ROOT/2026.6.4"
ACTIVE_RELEASE_FILE="$TEST_ROOT/active-release"
LOCK_ENV=(
    "PATH=$TEST_PATH"
    "ENV_FILE=$ENV_FILE"
    "SERVICE_NAME=$SERVICE_NAME"
    "NODE_BIN=$NODE_BINARY"
    "INSTALLER_TEST_SERVICE_DIR=$SERVICE_RELEASE"
    "INSTALLER_TEST_FIXTURE=$FIXTURE"
    "INSTALLER_TEST_CURL_LOG=$CURL_LOG"
    "INSTALLER_TEST_EXPECTED_SERVICE_DIR=$EXPECTED_SERVICE_RELEASE"
    "INSTALLER_TEST_ACTIVE_RELEASE=$ACTIVE_RELEASE_FILE"
)

: > "$CURL_LOG"
expect_lock_conflict "$TEST_ROOT/install-lock.log" env "${LOCK_ENV[@]}" "$CURRENT_RELEASE/installer.sh" install
expect_lock_conflict "$TEST_ROOT/upgrade-lock.log" env "${LOCK_ENV[@]}" "$CURRENT_RELEASE/installer.sh" upgrade 2026.6.4
expect_lock_conflict "$TEST_ROOT/cleanup-lock.log" env "${LOCK_ENV[@]}" "$CURRENT_RELEASE/installer.sh" cleanup --yes
if [ -s "$CURL_LOG" ]; then
    echo "Upgrade made network requests while the deployment lock was held." >&2
    exit 1
fi

FOREIGN_RELEASE="$TEST_ROOT/other-deployment/2026.6.3"
mkdir -p "$FOREIGN_RELEASE"
if env "${LOCK_ENV[@]}" "INSTALLER_TEST_SERVICE_DIR=$FOREIGN_RELEASE" "$CURRENT_RELEASE/installer.sh" install > "$TEST_ROOT/cross-instance.log" 2>&1; then
    cat "$TEST_ROOT/cross-instance.log" >&2
    echo "Installer replaced a service owned by another deployment." >&2
    exit 1
fi
grep -Fq "$SERVICE_NAME.service is configured for another deployment" "$TEST_ROOT/cross-instance.log"

if [ ! -d "$DEPLOYMENT_ROOT/2026.6.0" ]; then
    echo "Cleanup removed an old release while the deployment lock was held." >&2
    exit 1
fi

run_success "$TEST_ROOT/previous.log" env "${LOCK_ENV[@]}" "$CURRENT_RELEASE/installer.sh" versions --previous
grep -Fq '2026.6.1' "$TEST_ROOT/previous.log"
grep -Fq '2026.6.0' "$TEST_ROOT/previous.log"
if grep -Fq '2026.6.2' "$TEST_ROOT/previous.log" || grep -Fq '2026.6.3' "$TEST_ROOT/previous.log"; then
    echo "Previous-version listing included the service or current release." >&2
    exit 1
fi

run_success "$TEST_ROOT/cleanup.log" env "${LOCK_ENV[@]}" "$CURRENT_RELEASE/installer.sh" cleanup --keep 1 --yes
for version in 2026.6.1 2026.6.2 2026.6.3 2026.6.5; do
    if [ ! -d "$DEPLOYMENT_ROOT/$version" ]; then
        echo "Cleanup removed a release that should have been retained: $version" >&2
        exit 1
    fi
done
if [ -e "$DEPLOYMENT_ROOT/2026.6.0" ]; then
    echo "Cleanup did not remove the unretained previous release." >&2
    exit 1
fi

ARCHIVE_NAME="forum-2026.6.4-linux-x64.tar.gz"
PACKAGE_ROOT="$TEST_ROOT/package/forum/2026.6.4"
create_release "$PACKAGE_ROOT"
create_archive "$TEST_ROOT/package" forum
printf '{"tag_name":"v2026.6.4","draft":false,"prerelease":false,"assets":[{"name":"%s","state":"uploaded"},{"name":"%s.sha256","state":"uploaded"}]}\n' \
    "$ARCHIVE_NAME" "$ARCHIVE_NAME" > "$FIXTURE/release.json"

printf '%064d  %s\n' 0 "$ARCHIVE_NAME" > "$FIXTURE/$ARCHIVE_NAME.sha256"
expect_upgrade_rejection "$TEST_ROOT/bad-checksum.log" "FAILED"
create_archive "$TEST_ROOT/package" forum

UNEXPECTED_PACKAGE="$TEST_ROOT/unexpected-package"
mkdir -p "$UNEXPECTED_PACKAGE/forum/2026.6.4" "$UNEXPECTED_PACKAGE/unexpected"
create_release "$UNEXPECTED_PACKAGE/forum/2026.6.4"
printf 'unexpected\n' > "$UNEXPECTED_PACKAGE/unexpected/file"
create_archive "$UNEXPECTED_PACKAGE" forum unexpected
expect_upgrade_rejection "$TEST_ROOT/unexpected-path.log" "Release archive contains an unexpected path:"

MISSING_PACKAGE="$TEST_ROOT/missing-package"
mkdir -p "$MISSING_PACKAGE/forum/2026.6.4"
create_archive "$MISSING_PACKAGE" forum
expect_upgrade_rejection "$TEST_ROOT/missing-entrypoint.log" "Release archive is missing its installer or server entrypoint."

create_archive "$TEST_ROOT/package" forum
run_success "$TEST_ROOT/upgrade.log" env "${LOCK_ENV[@]}" "$CURRENT_RELEASE/installer.sh" upgrade 2026.6.4
if [ ! -x "$DEPLOYMENT_ROOT/2026.6.4/installer.sh" ]; then
    echo "Upgrade did not install the selected release." >&2
    exit 1
fi
grep -Fq 'Upgrade to 2026.6.4 is healthy' "$TEST_ROOT/upgrade.log"

SECOND_DEPLOYMENT_ROOT="$TEST_ROOT/forum-isolated-$$"
SECOND_SERVICE_NAME="$(basename "$SECOND_DEPLOYMENT_ROOT")"
SECOND_SERVICE_FILE="/etc/systemd/system/$SECOND_SERVICE_NAME.service"
SECOND_RELEASE="$SECOND_DEPLOYMENT_ROOT/2026.6.3"
SECOND_ENV_FILE="$TEST_ROOT/isolated.env"
SECOND_ACTIVE_RELEASE="$TEST_ROOT/isolated-active-release"
mkdir -p "$SECOND_RELEASE"
create_release "$SECOND_RELEASE"
sed \
    -e 's/^PORT=8001$/PORT=8002/' \
    -e "s|^NUXT_DATA_PATH=.*|NUXT_DATA_PATH=$TEST_ROOT/isolated-data|" \
    -e 's/^NUXT_SURREAL_INFO_NAMESPACE=.*/NUXT_SURREAL_INFO_NAMESPACE=installer_test_isolated/' \
    -e 's/^NUXT_SURREAL_INFO_DATABASE=.*/NUXT_SURREAL_INFO_DATABASE=installer_test_isolated/' \
    "$ENV_FILE" > "$SECOND_ENV_FILE"
if [ -e "$SECOND_SERVICE_FILE" ] || [ -L "$SECOND_SERVICE_FILE" ]; then
    echo "Refusing to overwrite an existing second-instance test service: $SECOND_SERVICE_FILE" >&2
    exit 1
fi
SECOND_SERVICE_FILE_CREATED=true
run_success "$TEST_ROOT/isolated-install.log" env \
    "PATH=$TEST_PATH" \
    "ENV_FILE=$SECOND_ENV_FILE" \
    "NODE_BIN=$NODE_BINARY" \
    "INSTALLER_TEST_SERVICE_DIR=" \
    "INSTALLER_TEST_EXPECTED_SERVICE_DIR=$SECOND_RELEASE" \
    "INSTALLER_TEST_ACTIVE_RELEASE=$SECOND_ACTIVE_RELEASE" \
    "$SECOND_RELEASE/installer.sh" install --service-name "$SECOND_SERVICE_NAME"
grep -Fxq "WorkingDirectory=$SECOND_RELEASE" "$SECOND_SERVICE_FILE"
if [ "$(cat "$ACTIVE_RELEASE_FILE")" != "$EXPECTED_SERVICE_RELEASE" ]; then
    echo "Installing the second instance changed the first instance's active release." >&2
    exit 1
fi

SECOND_PROXY_CONFIG="$SECOND_DEPLOYMENT_ROOT/nginx/$SECOND_SERVICE_NAME.conf"
run_success "$TEST_ROOT/proxy-setup.log" env \
    "PATH=$TEST_PATH" \
    "ENV_FILE=$SECOND_ENV_FILE" \
    "$SECOND_RELEASE/installer.sh" \
    proxy setup --server-name isolated.example.test --service-name "$SECOND_SERVICE_NAME"
grep -Fq 'server_name isolated.example.test;' "$SECOND_PROXY_CONFIG"
grep -Fq 'proxy_pass http://127.0.0.1:8002;' "$SECOND_PROXY_CONFIG"
grep -Fq 'proxy_set_header X-Forwarded-For $remote_addr;' "$SECOND_PROXY_CONFIG"

if env \
    "PATH=$TEST_PATH" \
    "ENV_FILE=$SECOND_ENV_FILE" \
    "$SECOND_RELEASE/installer.sh" \
    proxy setup --server-name replacement.example.test --service-name "$SECOND_SERVICE_NAME" > "$TEST_ROOT/proxy-overwrite.log" 2>&1; then
    cat "$TEST_ROOT/proxy-overwrite.log" >&2
    echo "Proxy setup overwrote an existing per-instance config." >&2
    exit 1
fi
grep -Fq 'refusing to overwrite' "$TEST_ROOT/proxy-overwrite.log"
grep -Fq 'server_name isolated.example.test;' "$SECOND_PROXY_CONFIG"

if env \
    "PATH=$TEST_PATH" \
    "ENV_FILE=$SECOND_ENV_FILE" \
    "$SECOND_RELEASE/installer.sh" \
    proxy setup --server-name 'isolated.example.test; return 301 /;' --service-name invalid-proxy-name > "$TEST_ROOT/proxy-invalid-name.log" 2>&1; then
    cat "$TEST_ROOT/proxy-invalid-name.log" >&2
    echo "Proxy setup accepted an unsafe server name." >&2
    exit 1
fi
grep -Fq 'Server name must be a DNS hostname' "$TEST_ROOT/proxy-invalid-name.log"

if env \
    "PATH=$TEST_PATH" \
    "ENV_FILE=$SECOND_ENV_FILE" \
    "NODE_BIN=$NODE_BINARY" \
    "INSTALLER_TEST_SERVICE_DIR=$SECOND_RELEASE" \
    "INSTALLER_TEST_EXPECTED_SERVICE_DIR=$SECOND_RELEASE" \
    "INSTALLER_TEST_ACTIVE_RELEASE=$SECOND_ACTIVE_RELEASE" \
    "INSTALLER_TEST_BUSY_PORT=8002" \
    "$SECOND_RELEASE/installer.sh" install --service-name "$SECOND_SERVICE_NAME" > "$TEST_ROOT/port-conflict.log" 2>&1; then
    cat "$TEST_ROOT/port-conflict.log" >&2
    echo "Installer accepted a port already used by another process." >&2
    exit 1
fi
grep -Fq 'PORT 8002 is already in use' "$TEST_ROOT/port-conflict.log"

echo "Installer behavior tests passed."