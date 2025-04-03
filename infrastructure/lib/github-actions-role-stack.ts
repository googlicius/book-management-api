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

    // Add permissions for ECS
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ecs:*',
          'elasticloadbalancing:*',
          'ec2:CreateSecurityGroup',
          'ec2:DescribeSecurityGroups',
          'ec2:AuthorizeSecurityGroupIngress',
          'ec2:DescribeSubnets',
          'ec2:DescribeVpcs',
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogGroups',
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
