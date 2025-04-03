# Book Management API

A GraphQL API for managing books, built with NestJS and deployed on AWS.

## Prerequisites

- Node.js (v18 or later)
- npm
- AWS CLI configured with appropriate credentials
- AWS CDK CLI (`npm install -g aws-cdk`)

## Project Structure

```
.
├── src/               # NestJS API source code
├── test/             # Test files
├── infrastructure/   # AWS CDK infrastructure
│   ├── lib/         # CDK stack definitions
│   ├── bin/         # CDK app entry point
│   └── package.json # Infrastructure dependencies
└── package.json     # API dependencies
```

## Local Development

1. Install dependencies:
```bash
# Install API dependencies
npm install

# Install infrastructure dependencies
cd infrastructure
npm install
cd ..
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your local configuration
```

3. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000/graphql`

## Infrastructure Setup

The project uses AWS CDK to manage infrastructure. The infrastructure is split into multiple stacks:

- `VpcStack`: VPC and networking components
- `DatabaseStack`: RDS PostgreSQL database
- `InfrastructureStack`: ECS Cluster, ECR Repository, and ALB
- `ApplicationStack`: ECS Service and application deployment

### Deploy Infrastructure

1. Bootstrap CDK (first time only):
```bash
cd infrastructure
npx cdk bootstrap
```

2. Deploy all stacks:
```bash
npx cdk deploy --all
```

Or deploy individual stacks:
```bash
# Deploy VPC first
npx cdk deploy BookManagementVpcStack

# Deploy database
npx cdk deploy BookManagementDatabaseStack

# Deploy infrastructure
npx cdk deploy BookManagementInfrastructureStack

# Deploy application
npx cdk deploy BookManagementApplicationStack
```

### Destroy Infrastructure

To clean up all resources:
```bash
cdk destroy --all
```

Or destroy individual stacks:
```bash
cdk destroy BookManagementApplicationStack
cdk destroy BookManagementInfrastructureStack
cdk destroy BookManagementDatabaseStack
cdk destroy BookManagementVpcStack
```

## Database Migrations

For local development, update your `.env` file with the correct `DATABASE_URL` value.

### Creating New Migrations

To create a new migration after changing the Prisma schema:

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name
```

## Application Deployment

1. Build the application:
```bash
npm run build
```

2. Build and push Docker image:
```bash
# Get the ECR repository URI from CDK outputs
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin <ECR_REPOSITORY_URI>

# Build and tag the image
docker build -t book-management-api .
docker tag book-management-api:latest <ECR_REPOSITORY_URI>:latest

# Push the image
docker push <ECR_REPOSITORY_URI>:latest
```

3. Deploy the application:
```bash
cd infrastructure
npx cdk deploy BookManagementApplicationStack
```

## Environment Variables

The application requires the following environment variables:

```env
# Database Configuration
DATABASE_HOST=
DATABASE_PORT=
DATABASE_USERNAME=
DATABASE_PASSWORD=
DATABASE_NAME=

# Or
DATABASE_URL=

# Application Configuration
NODE_ENV=production
```

These are automatically configured in the ECS service using AWS Secrets Manager.

## Monitoring and Logs

- Application logs are available in CloudWatch Logs
- Container insights are enabled for the ECS cluster
- Health checks are configured for the application

## Security

- The database is deployed in private subnets
- Application load balancer is internet-facing
- All sensitive data is stored in AWS Secrets Manager
- Security groups are configured to restrict access

## Troubleshooting

1. Check ECS service status:
```bash
aws ecs describe-services --cluster BookManagementCluster --services BookManagementService
```

2. View container logs:
```bash
aws logs get-log-events --log-group-name /ecs/BookManagementService
```

3. Check ALB health:
```bash
aws elbv2 describe-target-health --target-group-arn <TARGET_GROUP_ARN>
```
