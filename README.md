### Royal Grace — Local Dev, Testing, and GCP Deployment

This project contains:
- Frontend: Next.js 16 (Node 20) using pnpm
- Backend: Spring Boot (Java 21) with H2 (file-mode) for persistence

This guide covers running and testing locally, plus deploying to a Linux VM (e.g., GCP Compute Engine) with Docker Compose and Nginx.

#### Prerequisites
- Docker Desktop (or Docker Engine + Compose v2)
- Optional (host runs): Node 20+ with corepack/pnpm, Java 21 + Maven
- Optional (deploy): Google Cloud SDK (`gcloud`)

---

### Run everything locally (recommended)

Use Docker Compose from the repo root:

```bash
docker compose up --build
```

Services after startup:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- H2 console (dev): http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:file:/data/royalgrace`
  - Username: `sa` (password empty)

Default admin login (seeded on first run):
- Username: `admin`
- Password: `change-me`

Change these immediately from the Admin UI (see Admin security below) or by setting env vars shown later.

Compose persists the H2 database in a named volume `h2data`, so data survives container restarts.

---

### Run on a VM with production Docker Compose (behind Nginx)

There are two ways to run in production on a VM:

1) Recommended: use the GCP helper scripts under `deploy/gcp` (these set up Nginx and run prod Compose for you).
2) Manual: run `docker-compose.prod.yml` yourself and configure Nginx.

Why a prod file? The prod Compose binds Next.js only to `127.0.0.1:3000` (loopback) and expects Nginx on the host to reverse proxy public traffic to it. The frontend talks to the backend over the internal Docker network.

#### Option A — Using the helper scripts (GCP VM)
- Prereqs on your local machine:
  - `gcloud` installed and authenticated
  - Fill `deploy/gcp/.env` (see `deploy/gcp/.env.sample` for required values)

Steps:
1. Create VM and reserve static IP
   - `deploy/gcp/create_vm.sh`
2. Bootstrap the VM (Docker, Docker Compose plugin, Nginx, Certbot)
   - SSH to VM then run: `sudo /bin/bash -lc "/opt/royal-grace/deploy/gcp/bootstrap_vm.sh"`
3. Deploy the app (copies code to `/opt/royal-grace`, writes `.env`, installs Nginx site, runs prod compose)
   - `deploy/gcp/deploy_app.sh`
4. Point your domain A record to the VM’s static IP
5. Issue TLS certificate and enable HTTPS redirect
   - `deploy/gcp/issue_cert.sh`

Afterwards, browse to `https://<your-domain>`.

#### Option B — Manual run with docker-compose.prod.yml
If you already have a VM with Docker and Nginx:

1) On the VM, create an app directory and copy the project there:
```
sudo mkdir -p /opt/royal-grace
sudo chown "$USER": /opt/royal-grace
# Copy your project tree into /opt/royal-grace (scp/rsync/etc.)
```

2) Create `/opt/royal-grace/.env` with at least:
```
DOMAIN=app.example.com
EMAIL_FOR_SSL=admin@example.com

# Frontend → Backend (server-side calls inside Docker network)
API_BASE_URL=http://backend:8080

# Admin bootstrap (change these in production)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
ADMIN_JWT_SECRET=super-secret-change-me

# Backend database (defaults to file-based H2)
SPRING_DATASOURCE_URL=jdbc:h2:file:/data/royalgrace
SPRING_DATASOURCE_USERNAME=sa
SPRING_DATASOURCE_PASSWORD=
```

3) Start the app in production mode:
```
cd /opt/royal-grace
set -a && source .env && set +a
sudo docker compose -f docker-compose.prod.yml up -d --build
```

4) Configure Nginx on the host to reverse proxy to Next.js on 127.0.0.1:3000
- Use the provided site config as a starting point:
  - `/opt/royal-grace/deploy/gcp/nginx/royal-grace.conf`
- Replace `EXAMPLE_DOMAIN` with your domain and install it:
```
sudo sed 's/EXAMPLE_DOMAIN/your.domain.tld/g' \
  /opt/royal-grace/deploy/gcp/nginx/royal-grace.conf | \
  sudo tee /etc/nginx/sites-available/royal-grace >/dev/null
sudo ln -sf /etc/nginx/sites-available/royal-grace /etc/nginx/sites-enabled/royal-grace
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

5) Issue a TLS certificate (so the Secure admin cookie works in production)
```
sudo certbot --nginx -d your.domain.tld -m you@example.com --agree-tos --redirect -n
sudo systemctl reload nginx
```

Notes:
- In production, the login cookie is set with `Secure`; it will only persist over HTTPS.
- Do not expose the backend directly via Nginx. The Next.js server (API routes) calls the backend using `API_BASE_URL` inside the Docker network.
- The prod Compose binds Next.js to `127.0.0.1:3000` so it’s only reachable through Nginx.

### How to run local tests

There are two kinds of tests you can run locally right now:

1) Backend automated tests (JUnit via Maven)

```bash
cd backend
mvn -q test
```

2) End-to-end smoke tests (via curl) after `docker compose up --build`

```bash
# Upload a Zelle QR image to the backend (5MB limit; png/jpg/jpeg/webp)
curl -f -X POST \
  -F "file=@/path/to/zelle.png" \
  http://localhost:8080/api/payment/qr-codes/zelle

# Retrieve the QR via the frontend proxy and save it locally
curl -f -o zelle.png http://localhost:3000/api/payment/qr-codes/zelle

# Create a minimal order directly against the backend
curl -f -X POST -H 'content-type: application/json' \
  -d '{"customerName":"Test","items":[],"total":0}' \
  http://localhost:8080/api/orders

# Mark payment as completed (simulate QR verification)
ORDER_ID="<paste new order id>"
curl -f -X PATCH -H 'content-type: application/json' \
  -d '{"paymentStatus":"completed"}' \
  http://localhost:8080/api/orders/$ORDER_ID
```

Tip: You can also update through the frontend proxy:

```bash
curl -f -X POST -H 'content-type: application/json' \
  -d '{"orderId":"<id>","method":"zelle"}' \
  http://localhost:3000/api/payment/verify
```

Admin auth smoke tests:
```bash
# Verify credentials via backend (should be 200 for defaults)
curl -i -X POST -H 'content-type: application/json' \
  -d '{"username":"admin","password":"change-me"}' \
  http://localhost:8080/api/admin/verify

# Request a reset token (response includes devToken for local use)
curl -s -X POST -H 'content-type: application/json' \
  -d '{"usernameOrEmail":"admin"}' \
  http://localhost:8080/api/admin/forgot-password | jq

# Reset password with token (replace TOKEN)
curl -i -X POST -H 'content-type: application/json' \
  -d '{"token":"TOKEN","newPassword":"new-strong-password"}' \
  http://localhost:8080/api/admin/reset-password
```

---

### Running without Docker (optional)

If you prefer host processes during development:

Backend (Spring Boot):
```bash
cd backend
mvn -q clean package
mvn spring-boot:run
# Runs at http://localhost:8080
```

Frontend (Next.js):
```bash
# repo root
pnpm i
pnpm dev
# Runs at http://localhost:3000
```

By default, the frontend proxies to `http://localhost:8080`. To override, set `.env.local`:

```ini
API_BASE_URL=http://localhost:8080
```

---

### API quick reference (QR uploads)

- Upload: `POST /api/payment/qr-codes/{method}` (multipart/form-data; field `file`)
- Get: `GET /api/payment/qr-codes/{method}` (returns image)
- Delete: `DELETE /api/payment/qr-codes/{method}`

Valid `{method}` values: `zelle`, `venmo`, `cashapp`.

The frontend exposes identical proxy routes at `/api/payment/qr-codes/{method}` on port 3000.

---

### Product images (upload and display)

You can upload a real image for any product (card) and it will be served back as the product’s image URL. No test/placeholder images are used anywhere.

- Upload product image (backend):

```bash
curl -f -X POST \
  -F "file=@/path/to/product.jpg" \
  http://localhost:8080/api/cards/<CARD_ID>/image
```

- Retrieve product image (backend):

```bash
curl -f -o product.jpg http://localhost:8080/api/cards/<CARD_ID>/image
```

- Upload via frontend proxy (useful if your browser/app calls the frontend):

```bash
curl -f -X POST \
  -F "file=@/path/to/product.jpg" \
  http://localhost:3000/api/cards/<CARD_ID>/image
```

Notes:
- After upload, the backend sets the card’s `imageUrl` to `/api/cards/<CARD_ID>/image`, so the UI will immediately show the real image.
- In the Admin Products screen:
  - When editing an existing product, selecting a file uploads it immediately to `/api/cards/<id>/image`.
  - When creating a new product, the image is selected first and uploaded right after the product is created (using the new ID).
- The legacy mock upload route `/api/upload` is deprecated and returns `410 Gone` with guidance.

---

### Admin authentication and password management

- Login UI: http://localhost:3000/admin/login
- Forgot password: http://localhost:3000/admin/forgot-password
- Reset password: http://localhost:3000/admin/reset-password?token=... (use token from email or dev logs)
- Change password (requires login): http://localhost:3000/admin/settings/security

Backend endpoints:
- `POST /api/admin/verify` — body `{ username, password }`
- `POST /api/admin/change-password` — body `{ username, currentPassword, newPassword }` (username is injected by proxy)
- `POST /api/admin/forgot-password` — body `{ usernameOrEmail }` (always 200; includes `devToken` in local/dev)
- `POST /api/admin/reset-password` — body `{ token, newPassword }`

Default admin seeding (first run):
- Controlled by env vars on backend:
  - `ADMIN_DEFAULT_USERNAME` (default `admin`)
  - `ADMIN_DEFAULT_PASSWORD` (default `change-me`)
  - `ADMIN_DEFAULT_EMAIL` (optional)
  These can be set in `docker-compose.yml`.

---

### CORS

For local dev, the backend allows `http://localhost:3000` and `http://127.0.0.1:3000` on `/api/**`.
For production, add your deployed frontend origin to the allow-list (or make it env-driven).

---

### Build and deploy to Google Cloud Run

Both Docker images respect `$PORT` and are Cloud Run–ready.

Important: Cloud Run’s filesystem is ephemeral. The H2 file DB will not persist across restarts or deploys. For production, switch to a managed database (e.g., Cloud SQL). The steps below are suitable for validating containers.

1) Enable services and create an Artifact Registry repository

```bash
export PROJECT_ID=YOUR_PROJECT_ID
export REGION=us-central1   # choose your region

gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

gcloud artifacts repositories create rg-docker \
  --repository-format=Docker --location=$REGION \
  --description="Royal Grace containers"
```

2) Build and push images

```bash
# Backend
docker build -f backend/Dockerfile -t $REGION-docker.pkg.dev/$PROJECT_ID/rg-docker/backend:latest .
docker push $REGION-docker.pkg.dev/$PROJECT_ID/rg-docker/backend:latest

# Frontend
docker build -f frontend/Dockerfile -t $REGION-docker.pkg.dev/$PROJECT_ID/rg-docker/frontend:latest .
docker push $REGION-docker.pkg.dev/$PROJECT_ID/rg-docker/frontend:latest
```

3) Deploy to Cloud Run

```bash
# Backend (public)
gcloud run deploy rg-backend \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/rg-docker/backend:latest \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars SPRING_DATASOURCE_URL='jdbc:h2:file:/data/royalgrace' \
  --set-env-vars ADMIN_DEFAULT_USERNAME='admin' \
  --set-env-vars ADMIN_DEFAULT_PASSWORD='change-me' \
  --set-env-vars ADMIN_DEFAULT_EMAIL='' \
  --port 8080

# Copy the backend service URL from the output, e.g.:
# https://rg-backend-xxxxx-uc.a.run.app

# Frontend (set API_BASE_URL to backend URL)
BACKEND_URL=https://rg-backend-xxxxx-uc.a.run.app

gcloud run deploy rg-frontend \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/rg-docker/frontend:latest \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars API_BASE_URL=$BACKEND_URL,ADMIN_JWT_SECRET='super-secret-change-me' \
  --port 3000
```

4) Post-deploy
- Update backend CORS to include your Cloud Run frontend origin.
- Replace H2 with Cloud SQL for durable persistence before going live.

---

### Troubleshooting
- This repo enforces pnpm; `npm i` will fail by design. Use `pnpm i`.
- Ensure ports 3000 and 8080 are free locally (or edit `docker-compose.yml`).
- Multipart uploads: 5MB limit; only common image types are accepted; errors return JSON.
- H2 console is for development only; do not expose publicly in production.
- Admin auth:
  - If login fails, ensure backend is reachable from frontend and that the default user is seeded (check backend logs).
  - In local dev, password reset tokens are logged and returned as `devToken` by `/api/admin/forgot-password`.

---

### Repository map
- `frontend/Dockerfile` — Next.js container build
- `backend/Dockerfile` — Spring Boot container build
- `docker-compose.yml` — local stack (frontend + backend) with persistent H2 volume
- `backend/src/main/resources/application.yaml` — Spring/H2 configuration
- `app/api/*` — Next.js API routes that proxy to the backend
