# Book Management API Infrastructure

This directory contains the AWS CDK infrastructure code for deploying the Book Management API.

## Prerequisites

1. AWS CLI installed and configured
2. Node.js 18 or later
3. AWS CDK CLI installed (`npm install -g aws-cdk`)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

3. Deploy the infrastructure:
```bash
cdk deploy
```

## Infrastructure Components

The infrastructure includes:

- VPC with public and private subnets
- ECS Fargate cluster for running the application
- RDS PostgreSQL instance for the database
- ECR repository for storing Docker images
- Application Load Balancer
- Auto-scaling configuration
- Security groups and IAM roles

## Cost Optimization Features

- Single NAT Gateway to reduce costs
- T3.micro RDS instance
- Minimal Fargate resources (256 CPU units, 512MB memory)
- Auto-scaling from 1 to 4 instances based on CPU utilization
- 7-day backup retention
- Automatic minor version upgrades

## Deployment Process

1. Build and push the Docker image:
```bash
# Build the image
docker build -t book-management-api .

# Tag the image
docker tag book-management-api:latest <your-aws-account>.dkr.ecr.<region>.amazonaws.com/book-management-api:latest

# Push to ECR
docker push <your-aws-account>.dkr.ecr.<region>.amazonaws.com/book-management-api:latest
```

2. Deploy the infrastructure:
```bash
cdk deploy
```

3. The deployment will output the Load Balancer DNS name, which you can use to access your API. And the ECR Repository URI (where you'll push your Docker images).

## Cleanup

To remove all deployed resources:
```bash
cdk destroy
```

## Security Notes

- The database is deployed in private subnets
- All sensitive data is stored in AWS Secrets Manager
- Security groups are configured to allow only necessary traffic
- The application runs with minimal IAM permissions
