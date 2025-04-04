import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
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

    // Create the Fargate Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'BookManagementTaskDef', {
      cpu: 256,
      memoryLimitMiB: 512,
    });

    // Add container to the task definition
    const container = taskDefinition.addContainer('BookManagementContainer', {
      image: ecs.ContainerImage.fromEcrRepository(infrastructureStack.repository),
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
      logging: ecs.LogDrivers.awsLogs({ 
        streamPrefix: 'book-management-api' 
      }),
    });

    // Add port mapping to the container
    container.addPortMappings({
      containerPort: 3000,
      hostPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    // Create the Fargate Service
    const fargateService = new ecs.FargateService(this, 'BookManagementService', {
      cluster: infrastructureStack.cluster,
      taskDefinition,
      desiredCount: 1,
      securityGroups: [vpcStack.fargateSecurityGroup],
      assignPublicIp: true,
    });

    // Register the Fargate service with the ALB target group
    fargateService.attachToApplicationTargetGroup(infrastructureStack.targetGroup);

    // Allow the Fargate service to access the RDS instance
    databaseStack.database.connections.allowFrom(vpcStack.fargateSecurityGroup, ec2.Port.tcp(5432));

    // Set up auto scaling
    const scaling = fargateService.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 4,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    new cdk.CfnOutput(this, 'ServiceURL', {
      value: infrastructureStack.alb.loadBalancerDnsName,
      description: 'Service URL',
    });
  }
}
