import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';
import { getCertificateArn } from './config';

export class InfrastructureStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;
  public readonly repository: ecr.Repository;
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly certificate: acm.ICertificate;
  public readonly targetGroup: elbv2.ApplicationTargetGroup;
  public readonly httpsListener: elbv2.ApplicationListener;
  public readonly fargateSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, vpcStack: VpcStack, props?: cdk.StackProps) {
    super(scope, id, props);

    // Import existing certificate
    const certificateArn = getCertificateArn();
    this.certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', certificateArn);

    // Create security group for Fargate service
    this.fargateSecurityGroup = new ec2.SecurityGroup(this, 'FargateServiceSecurityGroup', {
      vpc: vpcStack.vpc,
      description: 'Security group for Fargate service',
      allowAllOutbound: true,
    });

    // Create security group for ALB
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: vpcStack.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    // Allow inbound HTTP traffic to ALB
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // Allow inbound HTTPS traffic to ALB
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

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
      securityGroup: this.albSecurityGroup,
    });

    // Create Target Group
    this.targetGroup = new elbv2.ApplicationTargetGroup(this, 'ApiTargetGroup', {
      vpc: vpcStack.vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        healthyHttpCodes: '200',
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 2,
        timeout: cdk.Duration.seconds(5),
        interval: cdk.Duration.seconds(30),
      },
    });

    // Create HTTPS Listener
    this.httpsListener = new elbv2.ApplicationListener(this, 'HttpsListener', {
      loadBalancer: this.alb,
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [this.certificate],
      defaultTargetGroups: [this.targetGroup],
      // Use SNI for multi-domain SSL support
      sslPolicy: elbv2.SslPolicy.RECOMMENDED,
    });

    // Create HTTP Listener that redirects to HTTPS
    new elbv2.ApplicationListener(this, 'HttpListener', {
      loadBalancer: this.alb,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
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

    // Output the certificate ARN
    new cdk.CfnOutput(this, 'CertificateARN', {
      value: this.certificate.certificateArn,
      description: 'Certificate ARN',
      exportName: 'BookManagementCertificateARN',
    });

    // Output the target group ARN
    new cdk.CfnOutput(this, 'TargetGroupARN', {
      value: this.targetGroup.targetGroupArn,
      description: 'Target Group ARN',
      exportName: 'BookManagementTargetGroupARN',
    });

    // Output the security group IDs
    new cdk.CfnOutput(this, 'FargateSecurityGroupId', {
      value: this.fargateSecurityGroup.securityGroupId,
      description: 'Fargate Service Security Group ID',
    });

    new cdk.CfnOutput(this, 'ALBSecurityGroupId', {
      value: this.albSecurityGroup.securityGroupId,
      description: 'ALB Security Group ID',
    });
  }
}
