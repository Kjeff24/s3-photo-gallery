# Deployment Guide

## Frontend Deployment to S3

### Step 1: Build the Frontend

```bash
cd frontend
npm run build
```

This creates a `dist/` folder with optimized, production-ready files:
- `index.html`
- JavaScript bundles (minified)
- CSS files
- Assets

### Step 2: Upload to S3

**Option A: Using AWS Console**

1. Go to your S3 bucket
2. Upload all files from `frontend/dist/` folder
3. Make sure to upload the folder structure as-is

**Option B: Using AWS CLI (Recommended)**

```bash
cd frontend

# Sync the dist folder to S3 bucket
aws s3 sync dist/ s3://your-frontend-bucket-name/ --delete

# Set correct content types and cache headers
aws s3 sync dist/ s3://your-frontend-bucket-name/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "*.html"

# Set short cache for HTML files (for updates)
aws s3 sync dist/ s3://your-frontend-bucket-name/ \
  --cache-control "public, max-age=0, must-revalidate" \
  --exclude "*" \
  --include "*.html"
```

### Step 3: Configure S3 Bucket for Static Website Hosting

1. Go to S3 bucket → **Properties** → **Static website hosting**
2. Enable static website hosting
3. Index document: `index.html`
4. Error document: `index.html` (for React Router support)

### Step 4: Configure CloudFront

**Origins:**
- **Origin 1 (Frontend):** S3 bucket with website endpoint
- **Origin 2 (Backend):** ALB with your backend

**Behaviors:**
1. **Path pattern:** `/api/*`
   - Origin: ALB (backend)
   - Viewer protocol: Redirect HTTP to HTTPS
   - Allowed methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
   - Cache policy: Managed-CachingDisabled (for API)

2. **Default (*)** 
   - Origin: S3 (frontend)
   - Viewer protocol: Redirect HTTP to HTTPS
   - Allowed methods: GET, HEAD, OPTIONS
   - Cache policy: Managed-CachingOptimized

**Error Pages (Important for React Router):**
- Error code: 403
- Response page path: `/index.html`
- HTTP response code: 200

- Error code: 404
- Response page path: `/index.html`
- HTTP response code: 200

### Architecture Overview

```
User Request
    ↓
CloudFront (CDN)
    ↓
    ├─→ /api/* → ALB → EC2 (Backend)
    └─→ /*      → S3 (Frontend static files)
```

### Deployment Script

Create `frontend/deploy.sh`:

```bash
#!/bin/bash

# Build the frontend
echo "Building frontend..."
npm run build

# Deploy to S3
echo "Deploying to S3..."
aws s3 sync dist/ s3://your-frontend-bucket-name/ --delete

# Set cache headers for assets
aws s3 sync dist/assets/ s3://your-frontend-bucket-name/assets/ \
  --cache-control "public, max-age=31536000, immutable"

# Set cache headers for HTML
aws s3 cp dist/index.html s3://your-frontend-bucket-name/index.html \
  --cache-control "public, max-age=0, must-revalidate" \
  --content-type "text/html"

# Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

echo "Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

### What NOT to Upload to S3

❌ Don't upload:
- `node_modules/`
- `src/` (source files)
- `.env` files
- `package.json`
- Development files

✅ Only upload:
- Contents of `dist/` folder (production build)

### For CI/CD (GitHub Actions)

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Build
        run: |
          cd frontend
          npm run build
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy to S3
        run: |
          cd frontend
          aws s3 sync dist/ s3://your-frontend-bucket-name/ --delete
      
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

### Important Notes

1. **Build first, then deploy** - Never upload source code
2. **Cache strategy** - Long cache for assets, short for HTML
3. **CloudFront invalidation** - Clear cache after deployment
4. **React Router** - Configure error pages to return index.html
5. **CORS** - Backend should allow requests from CloudFront domain

### Backend CORS Configuration

Update `backend/server.js`:

```javascript
// CORS configuration for CloudFront
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-cloudfront-domain.cloudfront.net', 'https://yourdomain.com']
    : '*',
  credentials: true,
};

app.use(cors(corsOptions));
```
