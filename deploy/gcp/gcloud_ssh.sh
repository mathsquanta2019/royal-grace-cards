#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/deploy/gcp/.env"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "$ENV_FILE" | xargs -0 -I{} bash -c 'echo {}' 2>/dev/null || grep -v '^#' "$ENV_FILE" | xargs)
fi

required=(PROJECT_ID ZONE VM_NAME)
for v in "${required[@]}"; do
  if [[ -z "${!v:-}" ]]; then echo "Missing required env: $v (see deploy/gcp/.env.sample)"; exit 1; fi
done

REMOTE_USER="${SSH_USER:-$USER}"
gcloud config set project "$PROJECT_ID" >/dev/null
exec gcloud compute ssh "${REMOTE_USER}@${VM_NAME}" --zone "$ZONE" -- "$@"
