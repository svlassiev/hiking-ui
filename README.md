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
| `/` | SimpleTimeline | Flat chronological photo feed with viewport-based image loading |
| `/?image={id}` | SimpleTimeline | Deep link — scrolls to a specific photo |
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

## Image Loading

Images load on demand based on viewport position, not sequentially from the top. An IntersectionObserver with 1000px look-ahead detects when image placeholders approach the viewport. A debounced handler (200ms) batches nearby unloaded images into a single API call. This works bidirectionally — scroll up or down, same logic.

Deep links (`/hiking?image={id}`) scroll to the target photo on mount and load images around it.

## Sharing

Each photo has a share icon that uses `navigator.share()` on mobile (native share sheet) or copies the share URL to clipboard on desktop. Share URLs go through hiking-api's `/share/hiking/image/{id}` endpoint which serves Open Graph meta tags for social media previews.

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
