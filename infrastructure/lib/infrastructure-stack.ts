import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
import { DatabaseStack } from './database-stack';
import { VpcStack } from './vpc-stack';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, vpcStack: VpcStack, databaseStack: DatabaseStack, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create ECS Cluster
    const cluster = new ecs.Cluster(this, 'BookManagementCluster', {
      vpc: vpcStack.vpc,
      containerInsights: true,
    });

    // Create ECR Repository
    const repository = new ecr.Repository(this, 'BookManagementRepository', {
      repositoryName: 'book-management-api',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      imageScanOnPush: true,
    });

    // Create Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: vpcStack.vpc,
      internetFacing: true,
      securityGroup: vpcStack.albSecurityGroup,
    });

    // Create Fargate Service
    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'BookManagementService', {
      cluster,
      cpu: 256, // Cost optimization: using minimal CPU
      memoryLimitMiB: 512, // Cost optimization: using minimal memory
      desiredCount: 1, // Cost optimization: starting with 1 instance
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(repository),
        containerPort: 3000,
        environment: {
          NODE_ENV: 'production',
        },
        secrets: {
          DATABASE_URL: ecs.Secret.fromSecretsManager(
            databaseStack.database.secret!,
            'postgresql://${username}:${password}@${host}:${port}/${dbname}'
          ),
        },
      },
      publicLoadBalancer: false, // We're using our own ALB
      assignPublicIp: true,
      securityGroups: [vpcStack.fargateSecurityGroup],
      loadBalancer: alb,
    });

    // Add auto scaling
    const scaling = fargateService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 4,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Allow the Fargate service to access the RDS instance
    databaseStack.database.connections.allowFrom(vpcStack.fargateSecurityGroup, ec2.Port.tcp(5432));

    // Output the load balancer DNS
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Load Balancer DNS',
    });

    // Output the ECR repository URI
    new cdk.CfnOutput(this, 'ECRRepositoryURI', {
      value: repository.repositoryUri,
      description: 'ECR Repository URI',
    });
  }
}
