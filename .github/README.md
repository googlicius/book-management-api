# GitHub Actions Deployment

This directory contains GitHub Actions workflows that automate the deployment of the Book Management API to AWS.

## Workflow: deploy.yml

The `deploy.yml` workflow automates the following steps:

1. **Build and Test**
   - Checks out the code
   - Sets up Node.js
   - Installs dependencies
   - Generates Prisma client
   - Runs tests
   - Builds the application
   - Uploads build artifacts for subsequent jobs

2. **Build and Push Docker Image**
   - Builds a Docker image for the application
   - Tags the image with the commit SHA and 'latest'
   - Pushes the image to Amazon ECR

3. **Deploy Application**
   - Deploys only the Application stack using AWS CDK
   - Updates the ECS Fargate service with the new Docker image

## Required Secrets

To use this workflow, you need to configure the following secret in your GitHub repository:

- `AWS_ROLE_ARN`: The ARN of an IAM role with permissions to deploy the application and push to ECR.

## IAM Role Setup

The GitHub Actions workflow uses OIDC (OpenID Connect) to authenticate with AWS. To set this up:

1. Create an IAM role in your AWS account with appropriate permissions:
   - AmazonECR-FullAccess
   - ECS permissions
   - CloudFormation permissions (for CDK deployments)

2. Configure the trust relationship for the role:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
           },
           "StringLike": {
             "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/YOUR_REPO:*"
           }
         }
       }
     ]
   }
   ```

3. Replace `ACCOUNT_ID` with your AWS account ID, and `YOUR_ORG/YOUR_REPO` with your GitHub organization and repository name.

4. Add the ARN of this role as the `AWS_ROLE_ARN` secret in your GitHub repository. 