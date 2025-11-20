#!/usr/bin/env bash
set -euo pipefail

# Obtain and install Let's Encrypt TLS certificate on Nginx via certbot

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/deploy/gcp/.env"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "$ENV_FILE" | xargs -0 -I{} bash -c 'echo {}' 2>/dev/null || grep -v '^#' "$ENV_FILE" | xargs)
fi

required=(PROJECT_ID ZONE VM_NAME DOMAIN EMAIL_FOR_SSL)
for v in "${required[@]}"; do
  if [[ -z "${!v:-}" ]]; then echo "Missing required env: $v (see deploy/gcp/.env.sample)"; exit 1; fi
done

REMOTE_USER="${SSH_USER:-$USER}"
REMOTE="${REMOTE_USER}@${VM_NAME}"

echo "Ensuring DNS for ${DOMAIN} resolves to your VM before proceeding..."
read -p "Press Enter to continue if DNS is set, or Ctrl+C to abort." _

echo "Running certbot --nginx on VM"
gcloud compute ssh "$REMOTE" --zone "$ZONE" --command \
  "sudo certbot --nginx -d ${DOMAIN} -m ${EMAIL_FOR_SSL} --agree-tos --redirect -n && sudo systemctl reload nginx"

echo "Testing auto-renewal (dry-run)"
gcloud compute ssh "$REMOTE" --zone "$ZONE" --command "sudo certbot renew --dry-run"

echo "Certificate installation complete. Visit: https://${DOMAIN}"