### DNS setup for your domain

You must point your domain (e.g., `app.example.com`) to the VM's static IP before issuing HTTPS certificates.

Prerequisites:
- You ran `deploy/gcp/create_vm.sh` and noted the Static IP output (e.g., `34.x.y.z`).
- You own/manage DNS for your domain at a registrar or DNS provider.

Option A — Using your external DNS provider/registrar:
1) Create an A record:
   - Name/Host: `app` (or `@` for root domain)
   - Type: `A`
   - TTL: 300 (or provider default)
   - Value: `34.x.y.z` (your VM static IP)
2) Wait for DNS to propagate. You can check with:
   ```bash
   dig +short app.example.com A
   ```

Option B — Using Google Cloud DNS:
1) Create a Cloud DNS managed zone (replace variables):
   ```bash
   gcloud dns managed-zones create royal-grace-zone \
     --dns-name=example.com. \
     --description="Royal Grace prod zone"
   ```
2) Add an A record for your subdomain (replace the IP and domain):
   ```bash
   gcloud dns records-sets transaction start --zone=royal-grace-zone
   gcloud dns records-sets transaction add 34.x.y.z \
     --name=app.example.com. --ttl=300 --type=A --zone=royal-grace-zone
   gcloud dns records-sets transaction execute --zone=royal-grace-zone
   ```
3) At your registrar, set nameservers to the Cloud DNS NS servers returned by:
   ```bash
   gcloud dns managed-zones describe royal-grace-zone --format='value(nameServers)'
   ```

Once `dig +short app.example.com A` returns your static IP, proceed to run `deploy/gcp/issue_cert.sh`.
