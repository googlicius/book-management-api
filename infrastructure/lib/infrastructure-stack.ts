import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';

export class InfrastructureStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;
  public readonly repository: ecr.Repository;
  public readonly alb: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, vpcStack: VpcStack, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create ECS Cluster
    this.cluster = new ecs.Cluster(this, 'BookManagementCluster', {
      vpc: vpcStack.vpc,
    });

    // Create ECR Repository
    this.repository = new ecr.Repository(this, 'BookManagementRepository', {
      repositoryName: 'book-management-api',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      imageScanOnPush: true,
    });

    // Create Application Load Balancer
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: vpcStack.vpc,
      internetFacing: true,
      securityGroup: vpcStack.albSecurityGroup,
    });

    // Export ALB DNS and Canonical Hosted Zone ID for the application stack
    new cdk.CfnOutput(this, 'ALBDNS', {
      value: this.alb.loadBalancerDnsName,
      description: 'Load Balancer DNS',
      exportName: 'BookManagementALBDNS',
    });

    new cdk.CfnOutput(this, 'ALBCanonicalHostedZoneId', {
      value: this.alb.loadBalancerCanonicalHostedZoneId,
      description: 'Load Balancer Canonical Hosted Zone ID',
      exportName: 'BookManagementALBCanonicalHostedZoneId',
    });

    new cdk.CfnOutput(this, 'ALBArn', {
      value: this.alb.loadBalancerArn,
      description: 'Load Balancer ARN',
      exportName: 'BookManagementALBArn',
    });

    // Output the ECR repository URI
    new cdk.CfnOutput(this, 'ECRRepositoryURI', {
      value: this.repository.repositoryUri,
      description: 'ECR Repository URI',
    });
  }
}
