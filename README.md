# hiking-ui

Vue 2 / Vuetify 2 frontend for the hiking photo gallery at [serg.vlassiev.info/hiking](https://serg.vlassiev.info/hiking).

## Architecture

```
Browser → nginx (this app) → hiking-api (Ktor backend) → MongoDB + GCS
```

- **Framework:** Vue 2.6 / Vuetify 2.3 / Vuex 3 / Vue Router 3
- **Build:** Vue CLI 4 / Webpack 4
- **Auth:** Firebase 9 (compat mode) for admin login
- **Docker image:** `svlassiev/hiking`
- **Cluster:** GKE `sixty-years-to-death` (europe-north1-a, project `thematic-acumen-225120`)

## Views

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | SimpleTimeline | Flat chronological photo feed with infinite scroll |
| `/timeline` | HikingTimeline | Albums as collapsible sections |
| `/login` | Login | Firebase email/password auth |
| `/edit` | Edit | Admin UI for managing albums and photos |

## CI/CD

Automated via GitHub Actions. Every push to `master`:

1. Builds Docker image and pushes to Docker Hub (tagged with commit SHA + `latest`)
2. Authenticates to GCP and gets GKE credentials
3. Applies K8s manifests (`k8s/hiking.yml`)
4. Deploys new image to the cluster

**Required GitHub secrets:** `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `GCP_SA_KEY`

## Local Development

```bash
npm install
npm run serve     # Dev server with hot reload
npm run build     # Production build
npm run lint      # Lint and fix
```

## Docker Build

```bash
docker build -t hiking-ui .
docker run -p 8080:80 hiking-ui
```
