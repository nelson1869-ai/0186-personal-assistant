#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd -P)"
TEST_ROOT="$(mktemp -d)"
export ASSISTANT_RUN_DIR="$TEST_ROOT/run"
mkdir -p -- "$ASSISTANT_RUN_DIR/logs"

cleanup() {
  bash "$REPO_ROOT/scripts/stop.sh" >/dev/null 2>&1 || true
  if [[ -n "${unrelated_pid:-}" ]]; then
    kill "$unrelated_pid" 2>/dev/null || true
    wait "$unrelated_pid" 2>/dev/null || true
  fi
  rm -rf -- "$TEST_ROOT"
}
trap cleanup EXIT

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

metadata_for() {
  local service="$1"
  local pid="$2"
  local token="$3"
  local generation="$4"
  local pgid start_time
  pgid="$(ps -o pgid= -p "$pid" | tr -d '[:space:]')"
  start_time="$(awk '{ print $22 }' "/proc/$pid/stat")"
  {
    printf 'pid=%s\n' "$pid"
    printf 'start_time=%s\n' "$start_time"
    printf 'pgid=%s\n' "$pgid"
    printf 'service=%s\n' "$service"
    printf 'token=%s\n' "$token"
    printf 'generation=%s\n' "$generation"
  } > "$ASSISTANT_RUN_DIR/$service.pid"
}

bash "$REPO_ROOT/scripts/stop.sh" >/dev/null || fail "stop must be idempotent"
stopped_status=0
bash "$REPO_ROOT/scripts/status.sh" >/dev/null 2>&1 || stopped_status=$?
[[ "$stopped_status" -eq 1 ]] || fail "stopped status must return 1"

setsid sleep 60 &
unrelated_pid=$!
metadata_for backend "$unrelated_pid" "not-the-process-token" "stale-test"
stale_status=0
bash "$REPO_ROOT/scripts/status.sh" > "$TEST_ROOT/stale-status.txt" || stale_status=$?
[[ "$stale_status" -eq 2 ]] || fail "stale status must return 2"
grep -q 'backend  stale' "$TEST_ROOT/stale-status.txt" || fail "status did not report stale metadata"
bash "$REPO_ROOT/scripts/stop.sh" >/dev/null || fail "stop must remove stale metadata"
kill -0 "$unrelated_pid" 2>/dev/null || fail "stop terminated an unrelated process"
[[ ! -f "$ASSISTANT_RUN_DIR/backend.pid" ]] || fail "stale PID file was not removed"

owned_token="owned-test-token"
setsid env \
  ASSISTANT_LAUNCHER_ID="0186-personal-assistant" \
  ASSISTANT_LAUNCHER_TOKEN="$owned_token" \
  ASSISTANT_LAUNCHER_SERVICE="backend" \
  sleep 60 &
owned_pid=$!
metadata_for backend "$owned_pid" "$owned_token" "owned-test"

status_output="$TEST_ROOT/status.txt"
status_code=0
bash "$REPO_ROOT/scripts/status.sh" > "$status_output" || status_code=$?
[[ "$status_code" -eq 2 ]] || fail "partial status must return 2"
grep -q 'backend  running' "$status_output" || fail "status did not identify the owned backend"
grep -q 'frontend stopped' "$status_output" || fail "status did not identify the stopped frontend"

bash "$REPO_ROOT/scripts/stop.sh" >/dev/null || fail "stop failed for an owned process"
wait "$owned_pid" 2>/dev/null || true
if kill -0 "$owned_pid" 2>/dev/null; then
  fail "owned process is still running"
fi

printf 'Shell lifecycle tests passed.\n'
