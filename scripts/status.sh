#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd -P)"
# shellcheck source=scripts/lib/runtime.sh
source "$SCRIPT_DIR/lib/runtime.sh"

RUN_DIR="$(runtime_root)"
LOG_DIR="$RUN_DIR/logs"

report_service() {
  local service="$1"
  local url="$2"
  local file log_file pid

  file="$(metadata_file "$service")"
  log_file="$LOG_DIR/$service.log"

  if [[ ! -f "$file" ]]; then
    printf '%-8s stopped  pid=-  url=%s  log=%s\n' "$service" "$url" "$log_file"
    return 1
  fi

  pid="$(metadata_value "$file" pid)"
  if metadata_is_valid "$file" "$service"; then
    printf '%-8s running  pid=%s  url=%s  log=%s\n' "$service" "$pid" "$url" "$log_file"
    return 0
  fi

  printf '%-8s stale    pid=%s  url=%s  log=%s  pid_file=%s\n' \
    "$service" "${pid:-unknown}" "$url" "$log_file" "$file"
  return 2
}

backend_result=0
frontend_result=0
report_service "$BACKEND_NAME" "$BACKEND_URL" || backend_result=$?
report_service "$FRONTEND_NAME" "$FRONTEND_URL" || frontend_result=$?

if [[ "$backend_result" -eq 0 && "$frontend_result" -eq 0 ]]; then
  exit 0
fi
if [[ "$backend_result" -eq 1 && "$frontend_result" -eq 1 ]]; then
  exit 1
fi
exit 2
