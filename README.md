# Photo Blog - Full Stack Application

A modern, full-stack photo blog application built with React, Node.js, Express, PostgreSQL, and AWS S3 for secure image storage with presigned URLs.

## Features

- 📸 **Direct S3 Uploads** - Upload images directly to S3 using presigned URLs (no backend bottleneck)
- 🔒 **Private S3 Bucket** - Images stored securely in private S3 bucket with presigned GET URLs
- 🔍 **Search & Filter** - Search photos by text and filter by tags
- ❤️ **Like Photos** - Like your favorite photos
- ✏️ **Edit & Delete** - Manage your photo collection
- 📱 **Responsive Design** - Works seamlessly on all devices
- 🎨 **Modern UI** - Clean and intuitive user interface
- 🔄 **Pagination** - Browse through photos efficiently
- ☁️ **Cloud Storage** - Images stored on AWS S3 with presigned URL access

## Tech Stack

### Backend
- Node.js 18+
- Express.js
- PostgreSQL with Sequelize ORM
- AWS RDS (PostgreSQL/Aurora)
- AWS S3 with presigned URLs (Private bucket)
- AWS SDK v3

### Frontend
- React 18
- React Router v6
- Axios
- React Icons
- React Toastify
- Vite (Build tool)

## Architecture

### Presigned URL Upload Flow
1. **Frontend** requests presigned URL from backend (`POST /api/photos/presigned-url`)
2. **Backend** generates presigned PUT URL and returns it with s3Key
3. **Frontend** uploads image directly to S3 using presigned URL (bypasses backend)
4. **Frontend** sends metadata (title, description, s3Key) to backend
5. **Backend** stores metadata and generates presigned GET URL (1 hour expiry)

### Benefits
- ✅ Faster uploads (browser → S3 direct)
- ✅ Reduced server load and bandwidth
- ✅ Private S3 bucket (no public access needed)
- ✅ Secure access with expiring URLs
- ✅ Better scalability

## Prerequisites

Before running this application, make sure you have:

- Node.js (v18 or higher)
- PostgreSQL (local) or AWS RDS
- AWS Account with:
  - S3 bucket (can be completely private)
  - IAM user credentials (local dev) or IAM role (EC2 production)

## Installation

### 1. Clone the repository

```bash
cd photo-blog-mini
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=5001
NODE_ENV=development

# PostgreSQL Configuration (Local or AWS RDS)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=photoblog
DB_USER=postgres
DB_PASS=your_password
DB_DIALECT=postgres

# AWS S3 Configuration
S3_BUCKET_NAME=your-photo-blog-bucket

# AWS Region
AWS_REGION=us-east-1

# AWS Credentials (Local Development Only)
# On EC2, use IAM roles instead - leave these empty
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
# Backend API URL for local development
VITE_API_URL=http://localhost:5001
```

### 4. AWS S3 Setup

**Create S3 Bucket:**
1. Go to AWS S3 Console
2. Create a new bucket (e.g., `photo-blog-bucket-24`)
3. **Keep the bucket private** - Block all public access ✅
4. No bucket policy needed (presigned URLs handle access)
5. No CORS configuration needed (presigned URLs bypass CORS for uploads)
6. Update `S3_BUCKET_NAME` in backend `.env`

**IAM Permissions:**

For local development, create an IAM user with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-photo-blog-bucket/photos/*"
    }
  ]
}
```

For EC2 production deployment, use an IAM role with the same permissions.

### 5. Database Setup

**Local PostgreSQL:**

```bash
# Create database
createdb photoblog

# Or using psql
psql postgres
CREATE DATABASE photoblog;
```

The tables will be automatically created when you start the backend server (Sequelize auto-sync in development mode).

**AWS RDS:**

1. Create RDS PostgreSQL instance in AWS Console
2. Note the endpoint, username, and password
3. Update `DB_HOST`, `DB_USER`, and `DB_PASSWORD` in `.env`

## Running the Application

### Start Backend Server

```bash
cd backend
npm start
# or for development with auto-reload
npm run dev
```

Backend runs on `http://localhost:5001`

### Start Frontend Server

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:3000` (or `http://localhost:5173` with Vite)

## API Endpoints

### Photos

- `GET /api/photos` - Get all photos (with presigned GET URLs)
- `GET /api/photos/:id` - Get single photo (with presigned GET URL)
- `POST /api/photos/presigned-url` - Get presigned URL for upload
- `POST /api/photos` - Create photo metadata
- `PUT /api/photos/:id` - Update photo
- `DELETE /api/photos/:id` - Delete photo
- `PUT /api/photos/:id/like` - Like photo
- `GET /api/photos/tags/all` - Get all tags

## Project Structure

```
photo-blog-mini/
├── backend/
│   ├── config/
│   │   ├── s3.js              # AWS S3 client configuration
│   │   └── database.js        # Sequelize database configuration
│   ├── controllers/
│   │   └── photoController.js # Photo CRUD and presigned URL logic
│   ├── middleware/
│   │   ├── errorHandler.js    # Global error handler
│   │   └── upload.js          # Multer configuration (legacy)
│   ├── models/
│   │   └── Photo.js           # Sequelize Photo model
│   ├── routes/
│   │   └── photoRoutes.js     # Photo API routes
│   ├── .env.example           # Environment variables template
│   ├── .gitignore
│   ├── package.json
│   └── server.js              # Express server entry point
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── photoAPI.js    # API client with presigned URL flow
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── PhotoCard.jsx
    │   │   └── SearchFilter.jsx
    │   ├── pages/
    │   │   ├── Edit.jsx
    │   │   ├── Home.jsx
    │   │   ├── PhotoDetail.jsx
    │   │   └── Upload.jsx
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env.example
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## Usage

### Upload a Photo

1. Click "Upload" in the navigation
2. Fill in the form:
   - Title (required)
   - Description (required)
   - Tags (comma-separated)
   - Location (optional)
   - Camera info (optional)
   - Image file (required, max 5MB)
3. Click "Upload Photo"
4. Image uploads directly to S3, metadata saved to database

### Edit a Photo

1. Click on a photo to view details
2. Click "Edit" button
3. Update any fields
4. Optionally upload a new image (replaces old one in S3)
5. Click "Save Changes"

### Search and Filter

- Use the search bar to find photos by title or description
- Click on tags to filter photos by specific tags
- Combine search and filters for precise results

## Docker Support

### Build and Run with Docker Compose

```bash
docker-compose up --build
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 5001
- Frontend on port 3000

### Individual Docker Commands

**Backend:**
```bash
cd backend
docker build -t photo-blog-backend .
docker run -p 5001:5001 --env-file .env photo-blog-backend
```

**Frontend:**
```bash
cd frontend
docker build -t photo-blog-frontend .
docker run -p 3000:80 photo-blog-frontend
```

## Environment Variables

### Backend (.env)

```env
PORT=5001                                    # Server port
NODE_ENV=development                         # Environment (development/production)

# PostgreSQL Configuration (Local or AWS RDS)
DB_HOST=localhost                            # Database host (or RDS endpoint)
DB_PORT=5432                                 # PostgreSQL port
DB_NAME=photoblog                            # Database name
DB_USER=postgres                             # Database username
DB_PASS=your_password                    # Database password
DB_DIALECT=postgres                          # Database dialect

# AWS S3 Configuration
S3_BUCKET_NAME=your-photo-blog-bucket        # S3 bucket name (can be private)

# AWS Region
AWS_REGION=us-east-1                         # AWS region

# AWS Credentials (Local Development Only)
# On EC2, leave these empty and use IAM roles instead
AWS_ACCESS_KEY_ID=your_aws_access_key        # AWS access key (local dev only)
AWS_SECRET_ACCESS_KEY=your_aws_secret_key    # AWS secret key (local dev only)
```

### Frontend (.env)

```env
# Backend API URL for local development
VITE_API_URL=http://localhost:5001
```

## Deployment

### Production Deployment on AWS

1. **Backend (EC2 with IAM Role):**
   - Launch EC2 instance
   - Attach IAM role with S3 permissions (no access keys needed)
   - Remove `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` from `.env`
   - Deploy backend code
   - Use PM2 or systemd for process management

2. **Frontend (S3 + CloudFront):**
   - Build frontend: `npm run build`
   - Upload `dist/` folder to S3
   - Configure CloudFront distribution:
     - Origin 1: S3 bucket (frontend static files)
     - Origin 2: ALB/EC2 (backend API at `/api/*`)
   - Update `VITE_API_URL` or use relative URLs

3. **Database (RDS):**
   - Use AWS RDS PostgreSQL or Aurora
   - Update `DB_HOST` with RDS endpoint
   - Ensure security group allows EC2 access

See `AWS_SETUP.md` for detailed AWS deployment instructions.

## Troubleshooting

### S3 Upload Fails

- **Presigned URL expired:** URLs expire in 5 minutes, request a new one
- **IAM permissions:** Ensure user/role has `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` permissions
- **Bucket name:** Verify `S3_BUCKET_NAME` matches actual bucket name
- **Region:** Ensure `AWS_REGION` matches bucket region
- **File size:** Max 5MB supported
- **Network issues:** Check internet connection

### Responsive Design
- Mobile-first approach
- Grid layout adapts to screen size

### Database Connection Issues

- **PostgreSQL not running:** Start PostgreSQL service
- **Connection refused:** Check `DB_HOST` and `DB_PORT` in `.env`
- **Authentication failed:** Verify `DB_USER` and `DB_PASSWORD`
- **Database doesn't exist:** Run `createdb photoblog`
- **RDS connection:** Ensure security group allows inbound connections from your IP

### Presigned URL Issues

- **GET URLs expire:** Presigned GET URLs expire after 1 hour (refresh page to get new ones)
- **PUT URLs expire:** Presigned PUT URLs expire after 5 minutes (upload within this time)
- **CORS errors:** Not needed with presigned URLs, but verify AWS region is correct

### Port Already in Use

```bash
# Kill process on port 5001 (backend)
lsof -ti:5001 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Environment Variables Not Loading

- Ensure `.env` file is in the correct directory (backend/ or frontend/)
- Check file is named exactly `.env` (not `.env.txt` or similar)
- Restart the server after changing `.env`
- Backend uses `-r dotenv/config` flag in npm scripts

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Use IAM roles on EC2** - No hardcoded credentials needed
3. **Keep S3 bucket private** - Presigned URLs handle access control
4. **Rotate AWS credentials** - Regularly update access keys
5. **Use HTTPS in production** - Secure data in transit
6. **Validate user input** - Prevent injection attacks
7. **Set presigned URL expiration** - Limit access window

## Performance Optimization

- **Presigned URLs** - Direct S3 uploads bypass backend bottleneck
- **Database indexing** - Fast searches with PostgreSQL full-text search
- **Pagination** - Load photos in chunks (12 per page)
- **Image optimization** - Compress images before upload (client-side)
- **CDN (CloudFront)** - Serve frontend and API through CDN in production
- **Connection pooling** - Sequelize manages database connections efficiently

## Future Enhancements

- [ ] User authentication (JWT/OAuth)
- [ ] Comments on photos
- [ ] Photo collections/albums
- [ ] Share to social media
- [ ] Image editing (crop, filters)
- [ ] Photo download option
- [ ] Infinite scroll
- [ ] Dark mode
- [ ] Batch upload (multiple photos)
- [ ] Photo metadata (EXIF data extraction)
- [ ] Mobile app (React Native)

## Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Presigned URLs Guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)

## License

MIT License - feel free to use this project for learning and development.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

For issues and questions, please create an issue in the repository.

---

Built with ❤️ using React, Node.js, PostgreSQL, and AWS



docker buildx build --platform linux/amd64 -t kjeff42/photo-blog-backend:latest .


docker push kjeff42/photo-blog-backend:latest