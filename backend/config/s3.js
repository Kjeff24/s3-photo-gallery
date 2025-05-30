import { S3Client } from '@aws-sdk/client-s3';

// Create S3 client configuration
const s3Config = {
  region: process.env.S3_BUCKET_REGION || 'us-east-1',
};

// Set region from environment variable
console.log('S3_BUCKET_REGION:', process.env.S3_BUCKET_REGION);
if (process.env.S3_BUCKET_REGION) {
  console.log(`Using S3 bucket region: ${process.env.S3_BUCKET_REGION}`);
} else {
  console.log(`Region not set - using default: ${s3Config.region}`);
}

// Only add credentials if they are provided (for local development)
// On EC2 with IAM role, credentials are automatically obtained
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
  console.log('Using AWS credentials from environment variables');
} else {
  console.log('Using IAM role credentials (recommended for EC2/ECS)');
}

const s3Client = new S3Client(s3Config);

export default s3Client;
