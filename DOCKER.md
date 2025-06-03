# Docker Guide for Photo Blog

## Quick Start with Docker Compose

### Development Environment (with local PostgreSQL)

```bash
# Start all services (backend + database + frontend)
docker-compose up

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (fresh database)
docker-compose down -v
```

This will start:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **PostgreSQL**: localhost:5432

---

## Backend Docker

### Build Backend Image

```bash
cd backend
docker build -t photo-blog-backend .
```

### Run Backend Container

**With local database:**
```bash
docker run -d \
  --name photo-blog-backend \
  -p 5000:5000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_NAME=photoblog \
  -e DB_USER=postgres \
  -e DB_PASS=your_password \
  -e DB_DIALECT=postgres \
  -e AWS_REGION=us-east-1 \
  -e S3_BUCKET_NAME=your-bucket \
  -e AWS_ACCESS_KEY_ID=your_key \
  -e AWS_SECRET_ACCESS_KEY=your_secret \
  photo-blog-backend
```

**With RDS (production):**
```bash
docker run -d \
  --name photo-blog-backend \
  -p 5000:5000 \
  -e DB_HOST=your-rds-endpoint.region.rds.amazonaws.com \
  -e DB_PORT=5432 \
  -e DB_NAME=photoblog \
  -e DB_USER=postgres \
  -e DB_PASS=your_rds_password \
  -e DB_DIALECT=postgres \
  -e AWS_REGION=us-east-1 \
  -e S3_BUCKET_NAME=your-bucket \
  photo-blog-backend
```

**Note:** When running on EC2 with IAM role, omit AWS credentials.

---

## Frontend Docker

### Development Build

```bash
cd frontend
docker build -f Dockerfile.dev -t photo-blog-frontend-dev .
docker run -p 3000:3000 photo-blog-frontend-dev
```

### Production Build

```bash
cd frontend
docker build -t photo-blog-frontend .
docker run -p 80:80 photo-blog-frontend
```

---

## Deploying to AWS ECR & ECS

### 1. Create ECR Repository

```bash
# Create repository
aws ecr create-repository --repository-name photo-blog-backend
aws ecr create-repository --repository-name photo-blog-frontend

# Get login command
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

### 2. Build & Push Backend

```bash
cd backend

# Build image
docker build -t photo-blog-backend .

# Tag for ECR
docker tag photo-blog-backend:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/photo-blog-backend:latest

# Push to ECR
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/photo-blog-backend:latest
```

### 3. Build & Push Frontend

```bash
cd frontend

# Build production image
docker build -t photo-blog-frontend .

# Tag for ECR
docker tag photo-blog-frontend:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/photo-blog-frontend:latest

# Push to ECR
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/photo-blog-frontend:latest
```

### 4. Deploy to ECS

Create ECS task definition and service using the ECR images.

**Backend Task Definition:**
```json
{
  "family": "photo-blog-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/photo-blog-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "5000"},
        {"name": "DB_HOST", "value": "your-rds-endpoint"},
        {"name": "DB_PORT", "value": "5432"},
        {"name": "DB_NAME", "value": "photoblog"},
        {"name": "DB_DIALECT", "value": "postgres"},
        {"name": "AWS_REGION", "value": "us-east-1"},
        {"name": "S3_BUCKET_NAME", "value": "your-bucket"}
      ],
      "secrets": [
        {"name": "DB_USER", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "DB_PASS", "valueFrom": "arn:aws:secretsmanager:..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/photo-blog-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "taskRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/PhotoBlogECSTaskRole",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole"
}
```

---

## Docker Commands Reference

### Backend

```bash
# Build
docker build -t photo-blog-backend backend/

# Run with environment file
docker run --env-file backend/.env -p 5000:5000 photo-blog-backend

# View logs
docker logs -f photo-blog-backend

# Execute commands in container
docker exec -it photo-blog-backend sh

# Stop container
docker stop photo-blog-backend

# Remove container
docker rm photo-blog-backend
```

### Frontend

```bash
# Build production
docker build -t photo-blog-frontend frontend/

# Run
docker run -p 80:80 photo-blog-frontend

# Build development
docker build -f frontend/Dockerfile.dev -t photo-blog-frontend-dev frontend/

# Run development
docker run -p 3000:3000 photo-blog-frontend-dev
```

### Database

```bash
# Access PostgreSQL
docker exec -it photo-blog-mini-postgres-1 psql -U postgres -d photoblog

# Backup database
docker exec photo-blog-mini-postgres-1 pg_dump -U postgres photoblog > backup.sql

# Restore database
docker exec -i photo-blog-mini-postgres-1 psql -U postgres photoblog < backup.sql
```

---

## Optimization Tips

### Multi-stage Builds (already implemented)

Backend and frontend Dockerfiles use multi-stage builds to:
- Reduce final image size
- Separate build and runtime dependencies
- Improve security (no build tools in production)

### Image Size Comparison

```bash
# Check image sizes
docker images | grep photo-blog

# Expected sizes:
# Backend: ~150MB (alpine-based)
# Frontend: ~25MB (nginx alpine + static files)
```

### Cache Optimization

```bash
# Use BuildKit for better caching
DOCKER_BUILDKIT=1 docker build -t photo-blog-backend backend/

# Build with no cache (clean build)
docker build --no-cache -t photo-blog-backend backend/
```

---

## Health Checks

### Backend Health Check

Add to Dockerfile:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD node -e "require('http').get('http://localhost:5000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

### Frontend Health Check

The nginx.conf includes a `/health` endpoint:
```bash
curl http://localhost/health
# Response: healthy
```

---

## Troubleshooting

### Backend won't connect to database

```bash
# Check if PostgreSQL is accessible
docker exec photo-blog-backend ping postgres

# View backend logs
docker logs photo-blog-backend

# Check environment variables
docker exec photo-blog-backend env | grep DB_
```

### Frontend can't reach backend

```bash
# Check if backend is running
curl http://localhost:5000/

# Check network connectivity
docker network inspect photo-blog-mini_default
```

### Container keeps restarting

```bash
# View crash logs
docker logs --tail 100 photo-blog-backend

# Inspect container
docker inspect photo-blog-backend
```

---

## CI/CD with Docker

### GitHub Actions Example

`.github/workflows/docker-deploy.yml`:
```yaml
name: Build and Deploy Docker Images

on:
  push:
    branches: [main]

jobs:
  build-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to ECR
        run: |
          aws ecr get-login-password --region us-east-1 | \
            docker login --username AWS --password-stdin \
            ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com
      
      - name: Build and Push Backend
        run: |
          cd backend
          docker build -t photo-blog-backend .
          docker tag photo-blog-backend:latest \
            ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com/photo-blog-backend:latest
          docker push ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com/photo-blog-backend:latest
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster photo-blog-cluster \
            --service backend-service \
            --force-new-deployment
```
