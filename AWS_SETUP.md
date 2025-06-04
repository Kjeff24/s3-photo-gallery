# AWS Setup Guide for Photo Blog

## Deployment Options

### Option A: EC2 Deployment (Recommended - No Access Keys Required) 🔒

When deploying to EC2, use **IAM roles** instead of access keys. This is more secure and follows AWS best practices.

#### Step 1: Create IAM Role for EC2

1. Go to **AWS IAM Console** → **Roles** → **Create Role**
2. Select **AWS service** → **EC2**
3. Attach the following policies:
   - `AmazonS3FullAccess` (or custom policy with s3:PutObject, s3:GetObject, s3:DeleteObject)
   - `AmazonRDSReadOnlyAccess` (for connecting to RDS)
4. Name the role: `PhotoBlogEC2Role`
5. Click **Create Role**

#### Step 2: Attach Role to EC2 Instance

1. Go to **EC2 Console** → Select your instance
2. **Actions** → **Security** → **Modify IAM role**
3. Select `PhotoBlogEC2Role`
4. Click **Update IAM role**

#### Step 3: Configure Environment Variables on EC2

Create `.env` file **without** AWS access keys:

```env
PORT=5000
NODE_ENV=production

# AWS Configuration
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-photo-blog-bucket

# Database Configuration
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=photoblog
DB_USER=your_db_username
DB_PASS=your_db_password
DB_DIALECT=postgres
```

**✅ The application will automatically use the IAM role credentials!**

---

### Option B: Local Development (Requires Access Keys) 💻

For local development, you'll need IAM user credentials.

#### Step 1: Create IAM User

1. Go to **AWS IAM Console** → **Users** → **Create User**
2. User name: `photo-blog-dev`
3. Enable **Programmatic access**
4. Attach policies:
   - `AmazonS3FullAccess`
5. Save the **Access Key ID** and **Secret Access Key**

#### Step 2: Configure Local Environment

Create `.env` file **with** AWS credentials:

```env
PORT=5000
NODE_ENV=development

# AWS Configuration
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-photo-blog-bucket
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# Database Configuration
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=photoblog
DB_USER=your_db_username
DB_PASS=your_db_password
DB_DIALECT=postgres
```

**⚠️ Important:**
- Never commit `.env` file to version control
- Never share your access keys
- Use IAM roles for production (EC2)

---

## Required AWS Resources

### 1. RDS PostgreSQL Database

1. Go to **AWS RDS Console**
2. Click **Create database**
3. Choose **PostgreSQL** or **Aurora PostgreSQL**
4. Select **Free tier** (for testing) or appropriate instance size
5. Configure:
   - DB instance identifier: `photoblog-db`
   - Master username: `postgres`
   - Master password: (create a strong password)
6. **Connectivity:**
   - VPC: Default VPC
   - Public access: **Yes** (for development) or **No** (for production with VPC peering)
   - Security group: Create new or use existing
7. Click **Create database**
8. Note the **Endpoint** for your `.env` file

#### Security Group Configuration

Allow inbound PostgreSQL traffic:
- Type: PostgreSQL
- Port: 5432
- Source: Your EC2 security group (production) or Your IP (development)

### 2. S3 Bucket

1. Go to **AWS S3 Console**
2. Click **Create bucket**
3. Bucket name: `your-unique-photo-blog-bucket`
4. Region: Same as your EC2/RDS
5. **Block Public Access settings:**
   - Uncheck "Block all public access" (for photo viewing)
6. Click **Create bucket**

#### Configure Bucket Policy

Go to bucket → **Permissions** → **Bucket Policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-photo-blog-bucket/photos/*"
    }
  ]
}
```

Replace `your-photo-blog-bucket` with your actual bucket name.

#### Configure CORS (if needed)

Go to bucket → **Permissions** → **CORS**:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

---

## How the Application Works

### IAM Role Authentication (EC2)

When running on EC2 with an IAM role:

1. The AWS SDK automatically detects it's running on EC2
2. It retrieves temporary credentials from the EC2 instance metadata service
3. No access keys needed in `.env` file
4. Credentials rotate automatically
5. More secure - no long-term credentials stored

### Access Key Authentication (Local)

When running locally with access keys:

1. The application reads `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` from `.env`
2. Uses these credentials for all AWS API calls
3. Credentials are static and must be managed manually

---

## Security Best Practices

✅ **DO:**
- Use IAM roles on EC2
- Use least-privilege IAM policies
- Enable MFA for IAM users
- Rotate access keys regularly
- Use VPC for RDS in production
- Enable RDS encryption at rest
- Use SSL/TLS for RDS connections
- Set up CloudWatch alarms for monitoring

❌ **DON'T:**
- Hard-code credentials in code
- Commit `.env` file to Git
- Share access keys
- Use root AWS account credentials
- Leave S3 buckets completely public (use bucket policies)

---

## Monitoring & Logging

### CloudWatch Logs

Set up CloudWatch for application logs:

```bash
# Install CloudWatch agent on EC2
sudo yum install amazon-cloudwatch-agent

# Configure log streaming
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
```

### Cost Optimization

- Use t3.micro or t3.small for EC2 (free tier eligible)
- Use db.t3.micro for RDS (free tier eligible)
- Enable S3 lifecycle policies to move old photos to cheaper storage
- Set up billing alerts in AWS Budgets
