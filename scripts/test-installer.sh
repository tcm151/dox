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
if [ -e "$SERVICE_FILE" ]; then
    echo "Refusing to overwrite an existing test service file: $SERVICE_FILE" >&2
    exit 1
fi
: > "$SERVICE_FILE"
trap 'rm -rf -- "$TEST_ROOT"; rm -f -- "$SERVICE_FILE"' EXIT

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
NUXT_DATA_PATH=$TEST_ROOT/data
NUXT_PUBLIC_BASE_URL=https://forum.example.test
NUXT_PUBLIC_SITE_TITLE=Installer Test
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
case "${1:-}" in
    is-active) exit 3 ;;
    show) printf '%s' "${INSTALLER_TEST_SERVICE_DIR:-}" ;;
    daemon-reload|enable) exit 0 ;;
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
        printf '{"app":"ready","database":"ready","version":"2026.6.4"}\n'
        ;;
    *)
        printf 'Unexpected curl URL: %s\n' "$url" >&2
        exit 1
        ;;
esac
CURL

chmod +x "$MOCK_BIN/systemctl" "$MOCK_BIN/curl"

run_success() {
    local output_file="$1"
    shift
    if ! "$@" > "$output_file" 2>&1; then
        cat "$output_file" >&2
        echo "Expected command to succeed: $*" >&2
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
LOCK_ENV=(
    "PATH=$TEST_PATH"
    "ENV_FILE=$ENV_FILE"
    "SERVICE_NAME=$SERVICE_NAME"
    "NODE_BIN=$NODE_BINARY"
    "INSTALLER_TEST_SERVICE_DIR=$SERVICE_RELEASE"
    "INSTALLER_TEST_FIXTURE=$FIXTURE"
    "INSTALLER_TEST_CURL_LOG=$CURL_LOG"
)

: > "$CURL_LOG"
expect_lock_conflict "$TEST_ROOT/install-lock.log" env "${LOCK_ENV[@]}" "$CURRENT_RELEASE/installer.sh" install
expect_lock_conflict "$TEST_ROOT/upgrade-lock.log" env "${LOCK_ENV[@]}" "$CURRENT_RELEASE/installer.sh" upgrade 2026.6.4
expect_lock_conflict "$TEST_ROOT/cleanup-lock.log" env "${LOCK_ENV[@]}" "$CURRENT_RELEASE/installer.sh" cleanup --yes
if [ -s "$CURL_LOG" ]; then
    echo "Upgrade made network requests while the deployment lock was held." >&2
    exit 1
fi
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
tar -czf "$FIXTURE/$ARCHIVE_NAME" -C "$TEST_ROOT/package" forum
(cd "$FIXTURE" && sha256sum "$ARCHIVE_NAME" > "$ARCHIVE_NAME.sha256")
printf '{"tag_name":"v2026.6.4","draft":false,"prerelease":false,"assets":[{"name":"%s","state":"uploaded"},{"name":"%s.sha256","state":"uploaded"}]}\n' \
    "$ARCHIVE_NAME" "$ARCHIVE_NAME" > "$FIXTURE/release.json"

run_success "$TEST_ROOT/upgrade.log" env "${LOCK_ENV[@]}" "$CURRENT_RELEASE/installer.sh" upgrade 2026.6.4
if [ ! -x "$DEPLOYMENT_ROOT/2026.6.4/installer.sh" ]; then
    echo "Upgrade did not install the selected release." >&2
    exit 1
fi
grep -Fq 'Upgrade to 2026.6.4 is healthy' "$TEST_ROOT/upgrade.log"

echo "Installer behavior tests passed."