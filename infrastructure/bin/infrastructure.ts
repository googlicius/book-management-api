#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/infrastructure-stack';
import { DatabaseStack } from '../lib/database-stack';
import { VpcStack } from '../lib/vpc-stack';
import { ApplicationStack } from '../lib/application-stack';
import { GithubActionsRoleStack } from '../lib/github-actions-role-stack';
import { KmsStack } from '../lib/kms-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'ap-southeast-1',
};

// Read repository info from environment variables or CDK context
const repositoryOwner = process.env.GITHUB_REPO_OWNER ||
  app.node.tryGetContext('repositoryOwner') ||
  'your-github-org';

const repositoryName = process.env.GITHUB_REPO_NAME ||
  app.node.tryGetContext('repositoryName') ||
  'book-management-graphql';

// Create the GitHub Actions IAM role stack
new GithubActionsRoleStack(app, 'BookManagementGithubActionsRoleStack', {
  env,
  description: 'IAM role for GitHub Actions to deploy Book Management API',
  repositoryOwner,
  repositoryName,
});

// Create the VPC stack first
const vpcStack = new VpcStack(app, 'BookManagementVpcStack', {
  env,
  description: 'VPC infrastructure for Book Management API',
});

// Create the KMS stack
new KmsStack(app, 'BookManagementKmsStack', {
  env,
  description: 'KMS key for SOPS encryption',
});

// Create the database stack that depends on the VPC stack
const databaseStack = new DatabaseStack(app, 'BookManagementDatabaseStack', vpcStack, {
  env,
  description: 'Database infrastructure for Book Management API',
});

// Create the main infrastructure stack that depends on both VPC and database stacks
const infrastructureStack = new InfrastructureStack(app, 'BookManagementInfrastructureStack', vpcStack, {
  env,
  description: 'Application infrastructure for Book Management API',
});

// Create the application stack that depends on VPC, database, and infrastructure stacks
new ApplicationStack(app, 'BookManagementApplicationStack', infrastructureStack, {
  env,
  description: 'Application deployment for Book Management API',
});
