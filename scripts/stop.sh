#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd -P)"
# shellcheck source=scripts/lib/runtime.sh
source "$SCRIPT_DIR/lib/runtime.sh"

RUN_DIR="$(runtime_root)"
GENERATION_FILTER=""
if [[ "${1:-}" == "--generation" ]]; then
  if [[ -z "${2:-}" || -n "${3:-}" ]]; then
    printf 'Usage: %s [--generation TOKEN]\n' "$0" >&2
    exit 64
  fi
  GENERATION_FILTER="$2"
elif [[ -n "${1:-}" ]]; then
  printf 'Usage: %s [--generation TOKEN]\n' "$0" >&2
  exit 64
fi

stop_service() {
  local service="$1"
  local file generation pid pgid token attempt

  file="$(metadata_file "$service")"
  if [[ ! -f "$file" ]]; then
    [[ -z "$GENERATION_FILTER" ]] && printf '%s: already stopped\n' "$service"
    return 0
  fi

  generation="$(metadata_value "$file" generation)"
  if [[ -n "$GENERATION_FILTER" && "$generation" != "$GENERATION_FILTER" ]]; then
    return 0
  fi

  pid="$(metadata_value "$file" pid)"
  pgid="$(metadata_value "$file" pgid)"
  token="$(metadata_value "$file" token)"

  if ! metadata_is_valid "$file" "$service"; then
    if [[ "$pgid" =~ ^[1-9][0-9]*$ ]] && [[ -n "$token" ]] && owned_group_is_running "$pgid" "$token" "$service"; then
      printf '%s: launcher exited; stopping verified child process group %s\n' "$service" "$pgid"
    else
      printf '%s: removing stale PID file without signaling PID %s\n' "$service" "${pid:-unknown}"
      rm -f -- "$file"
      return 0
    fi
  else
    printf '%s: gracefully stopping PID %s (process group %s)\n' "$service" "$pid" "$pgid"
  fi

  kill -TERM -- "-$pgid" 2>/dev/null || true
  for attempt in {1..50}; do
    if ! owned_group_is_running "$pgid" "$token" "$service"; then
      rm -f -- "$file"
      printf '%s: stopped\n' "$service"
      return 0
    fi
    sleep 0.1
  done

  if owned_group_is_running "$pgid" "$token" "$service"; then
    printf '%s: graceful timeout; forcing verified process group %s to stop\n' "$service" "$pgid" >&2
    kill -KILL -- "-$pgid" 2>/dev/null || true
  fi

  for attempt in {1..20}; do
    if ! owned_group_is_running "$pgid" "$token" "$service"; then
      rm -f -- "$file"
      printf '%s: stopped\n' "$service"
      return 0
    fi
    sleep 0.1
  done

  printf '%s: failed to stop verified process group %s\n' "$service" "$pgid" >&2
  return 1
}

result=0
stop_service "$BACKEND_NAME" || result=1
stop_service "$FRONTEND_NAME" || result=1

exit "$result"
