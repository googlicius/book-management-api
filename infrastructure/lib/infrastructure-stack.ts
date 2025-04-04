import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
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

  constructor(scope: Construct, id: string, vpcStack: VpcStack, props?: cdk.StackProps) {
    super(scope, id, props);

    // Import existing certificate
    const certificateArn = getCertificateArn();
    this.certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', certificateArn);

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
  }
}
