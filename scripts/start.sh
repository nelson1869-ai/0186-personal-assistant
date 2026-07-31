#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd -P)"
# shellcheck source=scripts/lib/runtime.sh
source "$SCRIPT_DIR/lib/runtime.sh"

RUN_DIR="$(runtime_root)"
LOG_DIR="$RUN_DIR/logs"
GENERATION="$(date +%s)-$$-$RANDOM"
CLEANUP_ACTIVE=1

cleanup() {
  local result=$?
  trap - EXIT INT TERM
  if [[ "$CLEANUP_ACTIVE" -eq 1 ]]; then
    bash "$SCRIPT_DIR/stop.sh" --generation "$GENERATION" || result=1
  fi
  exit "$result"
}

handle_interrupt() {
  printf '\nStopping local development services...\n'
  exit 130
}

handle_termination() {
  printf '\nTermination requested; stopping local development services...\n'
  exit 143
}

trap cleanup EXIT
trap handle_interrupt INT
trap handle_termination TERM

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    printf 'Required command not found: %s\n' "$command_name" >&2
    return 1
  fi
}

write_metadata() {
  local service="$1"
  local pid="$2"
  local url="$3"
  local log_file="$4"
  local token="$5"
  local file start_time pgid

  file="$(metadata_file "$service")"
  start_time="$(process_start_time "$pid")"
  pgid="$(process_group_id "$pid")"
  if [[ -z "$start_time" || -z "$pgid" || "$pgid" != "$pid" ]]; then
    printf 'Failed to capture a dedicated process group for %s (PID %s).\n' "$service" "$pid" >&2
    return 1
  fi

  {
    printf 'pid=%s\n' "$pid"
    printf 'start_time=%s\n' "$start_time"
    printf 'pgid=%s\n' "$pgid"
    printf 'service=%s\n' "$service"
    printf 'token=%s\n' "$token"
    printf 'generation=%s\n' "$GENERATION"
    printf 'url=%s\n' "$url"
    printf 'log=%s\n' "$log_file"
  } > "$file"
}

start_service() {
  local service="$1"
  local package_script="$2"
  local url="$3"
  local log_file="$LOG_DIR/$service.log"
  local token="$GENERATION-$service"
  local pid

  : > "$log_file"
  (
    cd -- "$REPO_ROOT"
    exec setsid env \
      "ASSISTANT_LAUNCHER_ID=$PROJECT_RUNTIME_ID" \
      "ASSISTANT_LAUNCHER_TOKEN=$token" \
      "ASSISTANT_LAUNCHER_SERVICE=$service" \
      pnpm "$package_script"
  ) >> "$log_file" 2>&1 &
  pid=$!

  sleep 0.1
  write_metadata "$service" "$pid" "$url" "$log_file" "$token"
}

wait_for_service() {
  local service="$1"
  local url="$2"
  local port="$3"
  local file log_file attempt

  file="$(metadata_file "$service")"
  log_file="$LOG_DIR/$service.log"
  for attempt in {1..300}; do
    if ! metadata_is_valid "$file" "$service"; then
      printf '%s exited during startup. See %s\n' "$service" "$log_file" >&2
      tail -n 30 -- "$log_file" >&2 || true
      return 1
    fi

    if command -v curl >/dev/null 2>&1; then
      if curl --fail --silent --show-error --max-time 1 "$url" >/dev/null 2>&1; then
        return 0
      fi
    elif port_is_occupied "$port"; then
      return 0
    fi
    sleep 0.1
  done

  printf '%s did not become ready at %s within 30 seconds. See %s\n' "$service" "$url" "$log_file" >&2
  return 1
}

cd -- "$REPO_ROOT"

require_command pnpm || exit 127
require_command uv || exit 127
require_command setsid || {
  printf 'Required command not found: setsid (provided by util-linux).\n' >&2
  exit 127
}

if [[ ! -x "$REPO_ROOT/apps/desktop/node_modules/.bin/vite" ]]; then
  printf 'Frontend dependencies are missing. Run exactly:\n  cd %q && pnpm install\n' "$REPO_ROOT" >&2
  exit 1
fi
if [[ ! -x "$REPO_ROOT/apps/api/.venv/bin/uvicorn" ]]; then
  printf 'Backend dependencies are missing. Run exactly:\n  cd %q && pnpm api:sync\n' "$REPO_ROOT" >&2
  exit 1
fi

bash "$SCRIPT_DIR/stop.sh"
mkdir -p -- "$LOG_DIR"

for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  if port_is_occupied "$port"; then
    printf 'Required port %s is occupied by a process not owned by this launcher. No process was terminated.\n' "$port" >&2
    show_port_diagnostic "$port"
    exit 1
  fi
done

start_service "$BACKEND_NAME" "api:dev" "$BACKEND_URL/api/v1/health"
start_service "$FRONTEND_NAME" "desktop:web" "$FRONTEND_URL"

wait_for_service "$BACKEND_NAME" "$BACKEND_URL/api/v1/health" "$BACKEND_PORT"
wait_for_service "$FRONTEND_NAME" "$FRONTEND_URL" "$FRONTEND_PORT"

backend_pid="$(metadata_value "$(metadata_file "$BACKEND_NAME")" pid)"
frontend_pid="$(metadata_value "$(metadata_file "$FRONTEND_NAME")" pid)"
printf '\nLocal application is ready.\n'
printf 'API:      %s (PID %s)\n' "$BACKEND_URL" "$backend_pid"
printf 'Frontend: %s (PID %s)\n' "$FRONTEND_URL" "$frontend_pid"
printf 'PID files: %s/{backend,frontend}.pid\n' "$RUN_DIR"
printf 'Logs:      %s/{backend,frontend}.log\n' "$LOG_DIR"
printf 'Press Ctrl+C to stop both services.\n\n'

while true; do
  if ! metadata_is_valid "$(metadata_file "$BACKEND_NAME")" "$BACKEND_NAME"; then
    printf 'Backend process exited unexpectedly. See %s/backend.log\n' "$LOG_DIR" >&2
    exit 1
  fi
  if ! metadata_is_valid "$(metadata_file "$FRONTEND_NAME")" "$FRONTEND_NAME"; then
    printf 'Frontend process exited unexpectedly. See %s/frontend.log\n' "$LOG_DIR" >&2
    exit 1
  fi
  sleep 1
done
