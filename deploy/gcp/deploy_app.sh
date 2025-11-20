#!/usr/bin/env bash
set -euo pipefail

# Deploy the app to the VM via rsync + docker compose, and install Nginx site

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

echo "Ensuring gcloud project set: $PROJECT_ID"
gcloud config set project "$PROJECT_ID" >/dev/null

echo "Creating remote app directory /opt/royal-grace"
gcloud compute ssh "$REMOTE" --zone "$ZONE" --command "sudo mkdir -p /opt/royal-grace && sudo chown -R \"$REMOTE_USER\": /opt/royal-grace"

echo "Transferring project via tar (excluding heavy dev artifacts)"
TMP_TAR=$(mktemp -d)/royal-grace.tar.gz
EXCLUDES=(
  --exclude='.git' --exclude='node_modules' --exclude='.next' --exclude='backend/target'
)
tar -C "$ROOT_DIR" -czf "$TMP_TAR" . "${EXCLUDES[@]}"
gcloud compute scp "$TMP_TAR" "$REMOTE:/tmp/royal-grace.tar.gz" --zone "$ZONE"
rm -f "$TMP_TAR"
gcloud compute ssh "$REMOTE" --zone "$ZONE" --command \
  "sudo rm -rf /opt/royal-grace/* && sudo tar -xzf /tmp/royal-grace.tar.gz -C /opt/royal-grace && rm -f /tmp/royal-grace.tar.gz && sudo chown -R \"$REMOTE_USER\": /opt/royal-grace"

echo "Writing .env on VM"
TMP_ENV=$(mktemp)
cat > "$TMP_ENV" <<EOF
DOMAIN=${DOMAIN}
EMAIL_FOR_SSL=${EMAIL_FOR_SSL}
API_BASE_URL=${API_BASE_URL:-http://backend:8080}
ADMIN_USERNAME=${ADMIN_USERNAME:-admin}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-change-me}
ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET:-super-secret-change-me}
SPRING_DATASOURCE_URL=${SPRING_DATASOURCE_URL:-jdbc:h2:file:/data/royalgrace}
SPRING_DATASOURCE_USERNAME=${SPRING_DATASOURCE_USERNAME:-sa}
SPRING_DATASOURCE_PASSWORD=${SPRING_DATASOURCE_PASSWORD:-}
EOF
gcloud compute scp "$TMP_ENV" "$REMOTE:/opt/royal-grace/.env" --zone "$ZONE"
rm -f "$TMP_ENV"

echo "Installing Nginx site config"
SITE_SRC="${ROOT_DIR}/deploy/gcp/nginx/royal-grace.conf"
if [[ ! -f "$SITE_SRC" ]]; then
  echo "Missing $SITE_SRC"; exit 1;
fi
gcloud compute scp "$SITE_SRC" "$REMOTE:/tmp/royal-grace.conf" --zone "$ZONE"
gcloud compute ssh "$REMOTE" --zone "$ZONE" --command \
  "sudo sed 's/EXAMPLE_DOMAIN/${DOMAIN}/g' /tmp/royal-grace.conf | sudo tee /etc/nginx/sites-available/royal-grace >/dev/null && \
   sudo ln -sf /etc/nginx/sites-available/royal-grace /etc/nginx/sites-enabled/royal-grace && \
   sudo rm -f /etc/nginx/sites-enabled/default || true && \
   sudo nginx -t && sudo systemctl reload nginx"

echo "Starting app via Docker Compose"
gcloud compute ssh "$REMOTE" --zone "$ZONE" --command \
  "cd /opt/royal-grace && set -a && source .env && set +a && sudo docker compose -f docker-compose.prod.yml up -d --build"

echo "Deployment completed. Next, obtain SSL certificate with deploy/gcp/issue_cert.sh"