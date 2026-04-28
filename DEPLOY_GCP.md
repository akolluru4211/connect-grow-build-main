# Google Cloud Deployment Guide: EdWorld Career OS

This guide outlines how to deploy the Dockerized EdWorld frontend to **Google Cloud Run** for high-scale, serverless operations.

## 1. Prerequisites
- Google Cloud Project with Billing enabled.
- [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install) installed locally.
- Docker installed and authenticated with GCP.

## 2. Authenticate & Configure
Run these commands in your terminal:
```bash
gcloud auth login
gcloud config set project [YOUR_PROJECT_ID]
gcloud auth configure-docker
```

## 3. Build & Push Image
Replace `[YOUR_PROJECT_ID]` with your actual GCP Project ID. We use **Google Artifact Registry** (recommended) or GCR.

```bash
# Tag the image
docker build -t gcr.io/[YOUR_PROJECT_ID]/edworld-frontend:latest .

# Push to Google Container Registry
docker push gcr.io/[YOUR_PROJECT_ID]/edworld-frontend:latest
```

## 4. Deploy to Cloud Run
This command deploys the container and makes it publicly accessible.

```bash
gcloud run deploy edworld-frontend \
  --image gcr.io/[YOUR_PROJECT_ID]/edworld-frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="VITE_SUPABASE_URL=[YOUR_URL],VITE_SUPABASE_ANON_KEY=[YOUR_KEY]"
```

## 5. Continuous Deployment (CI/CD)
For Production, it is recommended to use **Google Cloud Build**. 
Create a `cloudbuild.yaml` in the root (template below):

```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$$PROJECT_ID/edworld-frontend', '.']
  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$$PROJECT_ID/edworld-frontend']
  # Deploy container image to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'edworld-frontend'
      - '--image'
      - 'gcr.io/$$PROJECT_ID/edworld-frontend'
      - '--region'
      - 'us-central1'
images:
  - 'gcr.io/$$PROJECT_ID/edworld-frontend'
```

Connect your GitHub repository to **Cloud Build** in the GCP Console to trigger this on every push.
