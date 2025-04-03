# GitHub Actions IAM Role for AWS Deployments

This document explains how to deploy and use the IAM role for GitHub Actions deployments.

## Overview

The `GithubActionsRoleStack` creates:
- An OpenID Connect (OIDC) identity provider for GitHub Actions
- An IAM role with the necessary permissions to deploy your application
- The trust relationship between GitHub Actions and AWS

## Prerequisites

Before deploying this stack, you need:
1. AWS CLI configured with appropriate credentials
2. Your GitHub repository details (owner/organization and repository name)

## Deployment Steps

You can provide your GitHub repository details in multiple ways:

### Option 1: Using Environment Variables

Set environment variables before running the CDK deploy command:

```bash
export GITHUB_REPO_OWNER="your-github-username"
export GITHUB_REPO_NAME="book-management-graphql"
cd infrastructure
npm run build
npx cdk deploy BookManagementGithubActionsRoleStack
```

### Option 2: Using CDK Context Parameters

Use the `--context` flag with the CDK deploy command:

```bash
cd infrastructure
npm run build
npx cdk deploy BookManagementGithubActionsRoleStack \
  --context repositoryOwner=your-github-username \
  --context repositoryName=book-management-graphql
```

### Option 3: Using CDK Context in cdk.json

Add the repository information to your `cdk.json` file:

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/infrastructure.ts",
  "context": {
    "repositoryOwner": "your-github-username",
    "repositoryName": "book-management-graphql",
    ...other context values...
  }
}
```

Then run the normal deploy command:

```bash
cd infrastructure
npm run build
npx cdk deploy BookManagementGithubActionsRoleStack
```

### After Deployment

1. Note the IAM role ARN from the output:
   ```
   BookManagementGithubActionsRoleStack.GithubActionsRoleArn = arn:aws:iam::ACCOUNT_ID:role/BookManagementGithubActionsRole
   ```

2. Add this role ARN as a secret in your GitHub repository:
   - Go to your GitHub repository settings
   - Navigate to Secrets > Actions
   - Add a new repository secret with the name `AWS_ROLE_ARN`
   - Set the value to the ARN from step 1

## Permissions

The role includes these permissions:
- ECR full access (AmazonEC2ContainerRegistryFullAccess)
- CloudFormation permissions (for CDK deployments)
- ECS permissions (for managing Fargate services)
- Associated resource permissions (load balancers, logs, etc.)

## Troubleshooting

If you encounter permission issues during GitHub Actions workflow runs:

1. Check the IAM role's permissions in the AWS Management Console
2. Verify that the role trust relationship is configured correctly
3. Ensure GitHub Actions is configured to use OIDC with AWS
4. Check the secret is correctly named `AWS_ROLE_ARN` in your GitHub repository

## Security Considerations

The current implementation grants broad permissions to simplify setup. For production use, consider:

1. Limiting permissions to specific resources
2. Using condition keys to restrict access further
3. Implementing least privilege principles by refining the permissions 