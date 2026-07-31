#!/usr/bin/env bash

# Shared runtime helpers for the local development lifecycle scripts.

PROJECT_RUNTIME_ID="0186-personal-assistant"
BACKEND_NAME="backend"
BACKEND_URL="http://127.0.0.1:8000"
BACKEND_PORT="8000"
FRONTEND_NAME="frontend"
FRONTEND_URL="http://127.0.0.1:1420"
FRONTEND_PORT="1420"

runtime_root() {
  if [[ -n "${ASSISTANT_RUN_DIR:-}" ]]; then
    printf '%s\n' "$ASSISTANT_RUN_DIR"
  else
    printf '%s/.run\n' "$REPO_ROOT"
  fi
}

metadata_file() {
  local service="$1"
  printf '%s/%s.pid\n' "$RUN_DIR" "$service"
}

metadata_value() {
  local file="$1"
  local key="$2"
  awk -v prefix="$key=" 'index($0, prefix) == 1 { print substr($0, length(prefix) + 1); exit }' "$file"
}

process_start_time() {
  local pid="$1"
  awk '{ print $22 }' "/proc/$pid/stat" 2>/dev/null
}

process_state() {
  local pid="$1"
  awk '{ print $3 }' "/proc/$pid/stat" 2>/dev/null
}

process_group_id() {
  local pid="$1"
  ps -o pgid= -p "$pid" 2>/dev/null | tr -d '[:space:]'
}

process_has_identity() {
  local pid="$1"
  local token="$2"
  local service="$3"

  [[ -r "/proc/$pid/environ" ]] || return 1
  tr '\0' '\n' < "/proc/$pid/environ" | grep -Fqx "ASSISTANT_LAUNCHER_ID=$PROJECT_RUNTIME_ID" || return 1
  tr '\0' '\n' < "/proc/$pid/environ" | grep -Fqx "ASSISTANT_LAUNCHER_TOKEN=$token" || return 1
  tr '\0' '\n' < "/proc/$pid/environ" | grep -Fqx "ASSISTANT_LAUNCHER_SERVICE=$service"
}

metadata_is_valid() {
  local file="$1"
  local expected_service="$2"
  local pid start_time pgid token service

  [[ -f "$file" ]] || return 1
  pid="$(metadata_value "$file" pid)"
  start_time="$(metadata_value "$file" start_time)"
  pgid="$(metadata_value "$file" pgid)"
  token="$(metadata_value "$file" token)"
  service="$(metadata_value "$file" service)"

  [[ "$pid" =~ ^[1-9][0-9]*$ ]] || return 1
  [[ "$start_time" =~ ^[0-9]+$ ]] || return 1
  [[ "$pgid" =~ ^[1-9][0-9]*$ ]] || return 1
  [[ -n "$token" && "$service" == "$expected_service" ]] || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  [[ "$(process_state "$pid")" != "Z" ]] || return 1
  [[ "$(process_start_time "$pid")" == "$start_time" ]] || return 1
  [[ "$(process_group_id "$pid")" == "$pgid" ]] || return 1
  process_has_identity "$pid" "$token" "$service"
}

owned_group_is_running() {
  local pgid="$1"
  local token="$2"
  local service="$3"
  local proc pid candidate_pgid

  for proc in /proc/[0-9]*; do
    pid="${proc##*/}"
    [[ "$(process_state "$pid")" != "Z" ]] || continue
    candidate_pgid="$(process_group_id "$pid")"
    if [[ "$candidate_pgid" == "$pgid" ]] && process_has_identity "$pid" "$token" "$service"; then
      return 0
    fi
  done
  return 1
}

port_is_occupied() {
  local port="$1"
  (exec 9<>"/dev/tcp/127.0.0.1/$port") >/dev/null 2>&1
}

show_port_diagnostic() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltnp "sport = :$port" 2>&1 || true
  else
    printf 'Port %s accepts connections; install iproute2 to inspect its listener with ss.\n' "$port" >&2
  fi
}
