#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/infrastructure-stack';
import { DatabaseStack } from '../lib/database-stack';
import { VpcStack } from '../lib/vpc-stack';
import { ApplicationStack } from '../lib/application-stack';

const app = new cdk.App();

// Create the VPC stack first
const vpcStack = new VpcStack(app, 'BookManagementVpcStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'ap-southeast-1',
  },
  description: 'VPC infrastructure for Book Management API',
});

// Create the database stack that depends on the VPC stack
const databaseStack = new DatabaseStack(app, 'BookManagementDatabaseStack', vpcStack, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'ap-southeast-1',
  },
  description: 'Database infrastructure for Book Management API',
});

// Create the main infrastructure stack that depends on both VPC and database stacks
const infrastructureStack = new InfrastructureStack(app, 'BookManagementInfrastructureStack', vpcStack, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'ap-southeast-1',
  },
  description: 'Application infrastructure for Book Management API',
});

// Create the application stack that depends on VPC, database, and infrastructure stacks
new ApplicationStack(app, 'BookManagementApplicationStack', vpcStack, databaseStack, infrastructureStack, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'ap-southeast-1',
  },
  description: 'Application deployment for Book Management API',
});
