import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface GithubActionsRoleStackProps extends cdk.StackProps {
  repositoryOwner: string;
  repositoryName: string;
}

export class GithubActionsRoleStack extends cdk.Stack {
  public readonly role: iam.Role;
  
  constructor(scope: Construct, id: string, props: GithubActionsRoleStackProps) {
    super(scope, id, props);

    // Create the OpenID Connect provider for GitHub Actions
    const provider = new iam.OpenIdConnectProvider(this, 'GithubActionsProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    // Create the IAM role for GitHub Actions
    this.role = new iam.Role(this, 'GithubActionsRole', {
      assumedBy: new iam.WebIdentityPrincipal(
        provider.openIdConnectProviderArn,
        {
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          },
          StringLike: {
            'token.actions.githubusercontent.com:sub': `repo:${props.repositoryOwner}/${props.repositoryName}:*`,
          },
        }
      ),
      description: 'Role used by GitHub Actions to deploy Book Management API',
      roleName: 'BookManagementGithubActionsRole',
      maxSessionDuration: cdk.Duration.hours(1),
    });

    // Add permissions for ECR - using the correct AWS managed policy name
    this.role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryFullAccess')
    );

    // Add permissions for CloudFormation and CDK
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudformation:*',
        ],
        resources: ['*'],
      })
    );

    // Add EC2 permissions needed for deployment
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ec2:DescribeAvailabilityZones',
          'ec2:DescribeVpcs',
          'ec2:DescribeSubnets',
          'ec2:DescribeSecurityGroups',
          'ec2:DescribeInternetGateways',
          'ec2:DescribeNatGateways',
          'ec2:DescribeRouteTables',
          'ec2:DescribeDhcpOptions',
          'ec2:CreateSecurityGroup',
          'ec2:AuthorizeSecurityGroupIngress',
          'ec2:AuthorizeSecurityGroupEgress',
          'ec2:CreateTags',
          'ec2:DescribeTags'
        ],
        resources: ['*'],
      })
    );

    // Add S3 permissions for CDK asset storage
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:CreateBucket',
          's3:DeleteBucket',
          's3:PutBucketPolicy',
          's3:GetBucketPolicy',
          's3:DeleteBucketPolicy',
          's3:PutBucketVersioning',
          's3:GetBucketVersioning',
          's3:PutBucketPublicAccessBlock',
          's3:GetBucketPublicAccessBlock',
          's3:PutObject',
          's3:GetObject',
          's3:DeleteObject',
          's3:PutObjectAcl',
          's3:GetObjectAcl',
          's3:ListBucket',
          's3:GetBucketLocation',
          's3:GetBucketAcl',
          's3:PutBucketAcl'
        ],
        resources: ['*'],
      })
    );

    // Add SSM permissions needed for CDK bootstrap
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ssm:GetParameter',
          'ssm:GetParameters',
          'ssm:DescribeParameters',
          'ssm:PutParameter'
        ],
        resources: ['*'],
      })
    );

    // Add ECS permissions - needed for Fargate service
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ecs:*',
        ],
        resources: ['*'],
      })
    );

    // Add Elastic Load Balancing permissions
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'elasticloadbalancing:*',
        ],
        resources: ['*'],
      })
    );

    // Add IAM permissions for service roles
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'iam:GetRole',
          'iam:CreateRole',
          'iam:DeleteRole',
          'iam:PassRole',
          'iam:AttachRolePolicy',
          'iam:DetachRolePolicy',
          'iam:PutRolePolicy',
          'iam:GetRolePolicy',
          'iam:DeleteRolePolicy',
          'iam:TagRole'
        ],
        resources: ['*'],
      })
    );

    // Add Secrets Manager permissions - needed for database credentials
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
          'secretsmanager:ListSecretVersionIds'
        ],
        resources: ['*'],
      })
    );

    // Add Logs permissions
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
          'logs:DeleteLogGroup',
          'logs:DeleteLogStream'
        ],
        resources: ['*'],
      })
    );

    // Add Application Auto Scaling permissions for ECS service
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'application-autoscaling:*'
        ],
        resources: ['*'],
      })
    );

    // Output the role ARN
    new cdk.CfnOutput(this, 'GithubActionsRoleArn', {
      value: this.role.roleArn,
      description: 'ARN of the IAM role for GitHub Actions',
      exportName: 'BookManagementGithubActionsRoleArn',
    });
  }
}
