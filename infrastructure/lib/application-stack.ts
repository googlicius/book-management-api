import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
import { DatabaseStack } from './database-stack';
import { VpcStack } from './vpc-stack';
import { InfrastructureStack } from './infrastructure-stack';

export class ApplicationStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    vpcStack: VpcStack,
    databaseStack: DatabaseStack,
    infrastructureStack: InfrastructureStack,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    // Create Fargate Service
    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'BookManagementService', {
      cluster: infrastructureStack.cluster,
      cpu: 256,
      memoryLimitMiB: 512,
      desiredCount: 1,
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(infrastructureStack.repository),
        containerPort: 3000,
        environment: {
          NODE_ENV: 'production',
        },
        secrets: {
          DATABASE_HOST: ecs.Secret.fromSecretsManager(databaseStack.database.secret!, 'host'),
          DATABASE_PORT: ecs.Secret.fromSecretsManager(databaseStack.database.secret!, 'port'),
          DATABASE_USERNAME: ecs.Secret.fromSecretsManager(databaseStack.database.secret!, 'username'),
          DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(databaseStack.database.secret!, 'password'),
          DATABASE_NAME: ecs.Secret.fromSecretsManager(databaseStack.database.secret!, 'dbname'),
        },
      },
      publicLoadBalancer: false,
      assignPublicIp: true,
      securityGroups: [vpcStack.fargateSecurityGroup],
      loadBalancer: infrastructureStack.alb,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificate: infrastructureStack.certificate,
      redirectHTTP: true,
    });

    // Configure health check for the target group
    const targetGroup = fargateService.targetGroup;
    targetGroup.configureHealthCheck({
      path: '/health',
      healthyHttpCodes: '200',
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 2,
      timeout: cdk.Duration.seconds(5),
      interval: cdk.Duration.seconds(30),
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

    // Output the service URL
    new cdk.CfnOutput(this, 'ServiceURL', {
      value: infrastructureStack.alb.loadBalancerDnsName,
      description: 'Service URL',
    });
  }
}
