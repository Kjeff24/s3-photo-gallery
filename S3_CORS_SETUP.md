# S3 CORS Configuration

Your S3 bucket needs CORS configuration to allow direct uploads from the browser.

## Steps to Configure CORS:

### 1. Go to AWS S3 Console
- Navigate to https://s3.console.aws.amazon.com/s3/
- Find your bucket: `photo-blog-bucket-24`
- Click on the bucket name

### 2. Go to Permissions Tab
- Click on the "Permissions" tab
- Scroll down to "Cross-origin resource sharing (CORS)"
- Click "Edit"

### 3. Add CORS Configuration

Paste this JSON configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:5173",
            "https://yourdomain.com"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-server-side-encryption",
            "x-amz-request-id",
            "x-amz-id-2"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

### 4. Update for Production

When you deploy to production:
- Replace `http://localhost:3000` and `http://localhost:5173` with your CloudFront domain
- Example: `https://d1234567890.cloudfront.net`

### 5. Save Changes

Click "Save changes" and the CORS configuration will be applied immediately.

## Testing

After configuring CORS, try uploading an image again. The browser should now be able to upload directly to S3.

## Security Notes

- For production, only allow your actual domain origins
- Never use `"*"` for AllowedOrigins in production
- The presigned URL already provides security through signatures and expiration
