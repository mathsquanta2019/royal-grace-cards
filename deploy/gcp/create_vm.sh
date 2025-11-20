#!/usr/bin/env bash
set -euo pipefail

# Create a GCE VM with static IP and firewall rules suitable for Nginx + Docker Compose deployment

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/deploy/gcp/.env"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "$ENV_FILE" | xargs -0 -I{} bash -c 'echo {}' 2>/dev/null || grep -v '^#' "$ENV_FILE" | xargs)
fi

required=(PROJECT_ID REGION ZONE VM_NAME MACHINE_TYPE DISK_SIZE_GB IMAGE_FAMILY IMAGE_PROJECT STATIC_IP_NAME)
for v in "${required[@]}"; do
  if [[ -z "${!v:-}" ]]; then echo "Missing required env: $v (see deploy/gcp/.env.sample)"; exit 1; fi
done

echo "Ensuring project is set: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

echo "Creating/ensuring static IP: $STATIC_IP_NAME"
if ! gcloud compute addresses describe "$STATIC_IP_NAME" --region="$REGION" >/dev/null 2>&1; then
  gcloud compute addresses create "$STATIC_IP_NAME" --region="$REGION"
fi
STATIC_IP=$(gcloud compute addresses describe "$STATIC_IP_NAME" --region="$REGION" --format='get(address)')
echo "Static IP: $STATIC_IP"

echo "Opening firewall for SSH, HTTP, HTTPS"
if ! gcloud compute firewall-rules describe allow-http-https-ssh >/dev/null 2>&1; then
  gcloud compute firewall-rules create allow-http-https-ssh \
    --allow tcp:22,tcp:80,tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --target-tags web \
    --description "Allow SSH, HTTP, and HTTPS"
fi

echo "Creating VM $VM_NAME in $ZONE"
if ! gcloud compute instances describe "$VM_NAME" --zone "$ZONE" >/dev/null 2>&1; then
  gcloud compute instances create "$VM_NAME" \
    --zone="$ZONE" \
    --machine-type="$MACHINE_TYPE" \
    --boot-disk-size="$DISK_SIZE_GB" \
    --image-family="$IMAGE_FAMILY" \
    --image-project="$IMAGE_PROJECT" \
    --tags web \
    --address "$STATIC_IP"
fi

echo "VM external IP: $STATIC_IP"
echo "Next: Point your domain A record to $STATIC_IP (see deploy/gcp/dns_instructions.md)"