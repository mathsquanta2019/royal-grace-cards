#!/usr/bin/env bash
set -euo pipefail

# Bootstrap a fresh Ubuntu VM for Docker, Docker Compose, Nginx, and Certbot
# Run this ON the VM (via SSH). Safe to re-run.

if [[ $EUID -ne 0 ]]; then
  echo "Please run as root: sudo $0"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "[1/6] Updating packages"
apt-get update -y
apt-get upgrade -y

echo "[2/6] Installing dependencies"
apt-get install -y ca-certificates curl gnupg lsb-release software-properties-common ufw

echo "[3/6] Installing Docker Engine and Compose plugin"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable docker
systemctl start docker

echo "[4/6] Installing Nginx and Certbot"
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
apt-get install -y certbot python3-certbot-nginx

echo "[5/6] Configuring UFW (allow OpenSSH, HTTP, HTTPS)"
ufw allow OpenSSH || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
echo "y" | ufw enable || true
ufw status

echo "[6/6] Creating app directory and nginx sites"
mkdir -p /opt/royal-grace
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

echo "Bootstrap completed. Copy your app and Nginx config, then deploy."